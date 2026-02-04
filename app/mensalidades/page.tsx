'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { getMonthName } from '@/lib/formatters'
import { Plus, Trash2, Edit } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { debounce } from '@/lib/debounce'

interface Member {
  id: string
  name: string
  active: boolean
  monthly_fee: number
}

interface Payment {
  id: string
  member_id: string
  month: number
  year: number
  amount: number
  status: string
  paid_at: string | null
}

const MONTHS = [
  { number: 1, name: 'Janeiro', short: 'Jan' },
  { number: 2, name: 'Fevereiro', short: 'Fev' },
  { number: 3, name: 'Março', short: 'Mar' },
  { number: 4, name: 'Abril', short: 'Abr' },
  { number: 5, name: 'Maio', short: 'Mai' },
  { number: 6, name: 'Junho', short: 'Jun' },
  { number: 7, name: 'Julho', short: 'Jul' },
  { number: 8, name: 'Agosto', short: 'Ago' },
  { number: 9, name: 'Setembro', short: 'Set' },
  { number: 10, name: 'Outubro', short: 'Out' },
  { number: 11, name: 'Novembro', short: 'Nov' },
  { number: 12, name: 'Dezembro', short: 'Dez' },
]

export default function MensalidadesPage() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [newMember, setNewMember] = useState({ name: '', monthly_fee: 0 })

  const debouncedLoadMembers = useMemo(() => debounce(loadMembers, 300), [])
  const debouncedLoadPayments = useMemo(() => debounce(loadPayments, 300), [selectedYear])

  useEffect(() => {
    loadMembers()

    const membersSubscription = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        debouncedLoadMembers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(membersSubscription)
    }
  }, [debouncedLoadMembers])

  useEffect(() => {
    loadPayments()

    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_payments' }, () => {
        debouncedLoadPayments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(paymentsSubscription)
    }
  }, [selectedYear, debouncedLoadPayments])

  async function loadMembers() {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .order('name')

    setMembers(data || [])
  }

  async function loadPayments() {
    const { data } = await supabase
      .from('monthly_payments')
      .select('*')
      .eq('year', selectedYear)

    setPayments(data || [])
  }

  async function handleAddMember() {
    if (!newMember.name.trim()) return

    const { error } = await supabase
      .from('members')
      .insert([{
        name: newMember.name.trim().toUpperCase(),
        monthly_fee: newMember.monthly_fee,
        active: true
      }])

    if (!error) {
      setNewMember({ name: '', monthly_fee: 0 })
      setIsAddMemberOpen(false)
      loadMembers()
    }
  }

  async function handleUpdateMember() {
    if (!editingMember || !editingMember.name.trim()) return

    const { error } = await supabase
      .from('members')
      .update({
        name: editingMember.name.trim().toUpperCase(),
        monthly_fee: editingMember.monthly_fee
      })
      .eq('id', editingMember.id)

    if (!error) {
      setEditingMember(null)
      loadMembers()
    }
  }

  async function handleDeleteMember(id: string) {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return

    await supabase.from('members').delete().eq('id', id)
    loadMembers()
  }

  const handleTogglePayment = useCallback(async (member: Member, month: number) => {
    if (!isAdmin) return

    const existingPayment = payments.find(
      p => p.member_id === member.id && p.month === month && p.year === selectedYear
    )

    if (existingPayment) {
      let newStatus: string
      if (existingPayment.status === 'pending') {
        newStatus = 'paid'
      } else if (existingPayment.status === 'paid') {
        newStatus = 'not_paid'
      } else {
        newStatus = 'pending'
      }

      setPayments(prev => prev.map(p =>
        p.id === existingPayment.id
          ? { ...p, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null }
          : p
      ))

      const { error } = await supabase
        .from('monthly_payments')
        .update({
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', existingPayment.id)

      if (error) {
        loadPayments()
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const newPayment: Payment = {
        id: tempId,
        member_id: member.id,
        month: month,
        year: selectedYear,
        amount: member.monthly_fee,
        status: 'paid',
        paid_at: new Date().toISOString()
      }

      setPayments(prev => [...prev, newPayment])

      const { data, error } = await supabase
        .from('monthly_payments')
        .insert([{
          member_id: member.id,
          month: month,
          year: selectedYear,
          amount: member.monthly_fee,
          status: 'paid',
          paid_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (!error && data) {
        setPayments(prev => prev.map(p => p.id === tempId ? data : p))
      } else {
        loadPayments()
      }
    }
  }, [isAdmin, payments, selectedYear])

  const getPaymentStatus = useCallback((memberId: string, month: number): 'paid' | 'pending' | 'not_paid' => {
    const payment = payments.find(
      p => p.member_id === memberId && p.month === month && p.year === selectedYear
    )
    return payment?.status as 'paid' | 'pending' | 'not_paid' || 'pending'
  }, [payments, selectedYear])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-900">Controle de Mensalidades</h1>
            <p className="text-gray-600 mt-1">Acompanhamento dos pagamentos dos filhos de casa</p>
          </div>

          <div className="flex gap-3">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Membro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Digite o nome do membro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fee">Mensalidade (R$)</Label>
                      <Input
                        id="fee"
                        type="number"
                        step="0.01"
                        value={newMember.monthly_fee}
                        onChange={(e) => setNewMember({ ...newMember, monthly_fee: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <Button onClick={handleAddMember} className="w-full bg-purple-600 hover:bg-purple-700">
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Card className="border-purple-100 shadow-md">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 border border-gray-200 sticky left-0 z-10 bg-gray-50">
                      Filhos(a)
                    </th>
                    {MONTHS.map((month) => (
                      <th key={month.number} className="p-3 bg-gray-50 font-semibold text-gray-700 border border-gray-200 min-w-[100px]">
                        {month.name}
                      </th>
                    ))}
                    {isAdmin && (
                      <th className="p-3 bg-gray-50 font-semibold text-gray-700 border border-gray-200 sticky right-0 z-10 bg-gray-50">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-purple-50 transition-colors">
                      <td className="p-3 border border-gray-200 font-semibold text-gray-900 sticky left-0 z-10 bg-white">
                        {member.name}
                      </td>
                      {MONTHS.map((month) => {
                        const status = getPaymentStatus(member.id, month.number)
                        return (
                          <td key={month.number} className="p-2 border border-gray-200 text-center">
                            {isAdmin ? (
                              <Button
                                onClick={() => handleTogglePayment(member, month.number)}
                                size="sm"
                                className={`w-full ${
                                  status === 'paid'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : status === 'not_paid'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                {status === 'paid' ? 'Pago' : status === 'not_paid' ? 'NÃO PAGO' : 'Pendente'}
                              </Button>
                            ) : (
                              <div
                                className={`py-2 px-3 rounded text-sm font-medium ${
                                  status === 'paid'
                                    ? 'bg-green-600 text-white'
                                    : status === 'not_paid'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {status === 'paid' ? 'Pago' : status === 'not_paid' ? 'NÃO PAGO' : 'Pendente'}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      {isAdmin && (
                        <td className="p-2 border border-gray-200 sticky right-0 z-10 bg-white">
                          <div className="flex gap-1 justify-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingMember(member)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Membro</DialogTitle>
                                </DialogHeader>
                                {editingMember && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-name">Nome</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingMember.name}
                                        onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-fee">Mensalidade (R$)</Label>
                                      <Input
                                        id="edit-fee"
                                        type="number"
                                        step="0.01"
                                        value={editingMember.monthly_fee}
                                        onChange={(e) => setEditingMember({
                                          ...editingMember,
                                          monthly_fee: parseFloat(e.target.value) || 0
                                        })}
                                      />
                                    </div>
                                    <Button onClick={handleUpdateMember} className="w-full bg-purple-600 hover:bg-purple-700">
                                      Salvar
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {members.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Nenhum membro cadastrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
