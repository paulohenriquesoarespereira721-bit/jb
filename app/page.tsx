'use client'

import { useEffect, useState, useMemo } from 'react'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { DashboardCard } from '@/components/DashboardCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, TrendingUp, DollarSign, Users, Edit2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMonthName } from '@/lib/formatters'
import { debounce } from '@/lib/debounce'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardData {
  currentCash: number
  investment: number
  monthlyIncome: number
  activeMembers: number
}

interface MonthlyCash {
  id?: string
  month: number
  year: number
  amount: number
}

export default function Home() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData>({
    currentCash: 0,
    investment: 0,
    monthlyIncome: 0,
    activeMembers: 0,
  })
  const [monthlyCash, setMonthlyCash] = useState<MonthlyCash[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCash, setEditingCash] = useState<MonthlyCash | null>(null)
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
  })
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false)
  const [investmentValue, setInvestmentValue] = useState('')
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false)
  const [cashValue, setCashValue] = useState('')

  const debouncedLoadDashboard = useMemo(() => debounce(loadDashboardData, 500), [])

  useEffect(() => {
    loadDashboardData()

    const incomeSubscription = supabase
      .channel('income-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income' }, () => {
        debouncedLoadDashboard()
      })
      .subscribe()

    const expensesSubscription = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        debouncedLoadDashboard()
      })
      .subscribe()

    const membersSubscription = supabase
      .channel('members-changes-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        debouncedLoadDashboard()
      })
      .subscribe()

    const settingsSubscription = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        debouncedLoadDashboard()
      })
      .subscribe()

    const monthlyCashSubscription = supabase
      .channel('monthly-cash-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_cash' }, () => {
        debouncedLoadDashboard()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(incomeSubscription)
      supabase.removeChannel(expensesSubscription)
      supabase.removeChannel(membersSubscription)
      supabase.removeChannel(settingsSubscription)
      supabase.removeChannel(monthlyCashSubscription)
    }
  }, [debouncedLoadDashboard])

  async function loadDashboardData() {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const [incomeResult, expensesResult, membersResult, settingsResult, monthlyCashResult] = await Promise.all([
      supabase.from('income').select('amount, month, year'),
      supabase.from('expenses').select('amount, month, year'),
      supabase.from('members').select('id').eq('active', true),
      supabase.from('settings').select('value').eq('key', 'investment').maybeSingle(),
      supabase.from('monthly_cash').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    ])

    const allIncome = incomeResult.data || []
    const allExpenses = expensesResult.data || []
    const totalIncome = allIncome.reduce((sum, item) => sum + Number(item.amount), 0)
    const totalExpenses = allExpenses.reduce((sum, item) => sum + Number(item.amount), 0)
    const currentCash = totalIncome - totalExpenses

    const monthlyIncome = allIncome
      .filter(item => item.month === currentMonth && item.year === currentYear)
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const monthlyCashData = (monthlyCashResult.data || []).map(item => ({
      id: item.id,
      month: item.month,
      year: item.year,
      amount: Number(item.amount),
    }))

    setData({
      currentCash,
      investment: Number(settingsResult.data?.value || 0),
      monthlyIncome,
      activeMembers: membersResult.data?.length || 0,
    })

    setMonthlyCash(monthlyCashData)
  }

  function openDialog(cashItem?: MonthlyCash) {
    if (cashItem) {
      setEditingCash(cashItem)
      setFormData({
        month: cashItem.month,
        year: cashItem.year,
        amount: cashItem.amount.toString(),
      })
    } else {
      setEditingCash(null)
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: '',
      })
    }
    setIsDialogOpen(true)
  }

  async function openCashDialog() {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const { data: existingCash } = await supabase
      .from('monthly_cash')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle()

    setCashValue(existingCash?.amount?.toString() || '')
    setIsCashDialogOpen(true)
  }

  async function handleSaveCash() {
    if (!isAdmin) {
      toast.error('Apenas administradores podem realizar esta ação')
      return
    }

    const amount = parseFloat(cashValue)
    if (isNaN(amount)) {
      toast.error('Digite um valor válido')
      return
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    try {
      const { data: existingCash } = await supabase
        .from('monthly_cash')
        .select('id')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle()

      if (existingCash) {
        const { error } = await supabase
          .from('monthly_cash')
          .update({
            amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCash.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('monthly_cash')
          .insert({
            month: currentMonth,
            year: currentYear,
            amount,
          })

        if (error) throw error
      }

      toast.success('Caixa atualizado com sucesso')
      setIsCashDialogOpen(false)
      loadDashboardData()
    } catch (error) {
      toast.error('Erro ao salvar caixa')
      console.error('Error saving current cash:', error)
    }
  }

  async function handleSave() {
    if (!isAdmin) {
      toast.error('Apenas administradores podem realizar esta ação')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount)) {
      toast.error('Digite um valor válido')
      return
    }

    try {
      if (editingCash?.id) {
        const { error } = await supabase
          .from('monthly_cash')
          .update({
            month: formData.month,
            year: formData.year,
            amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCash.id)

        if (error) throw error
        toast.success('Caixa atualizado com sucesso')
      } else {
        const { error } = await supabase
          .from('monthly_cash')
          .insert({
            month: formData.month,
            year: formData.year,
            amount,
          })

        if (error) throw error
        toast.success('Caixa adicionado com sucesso')
      }

      setIsDialogOpen(false)
      loadDashboardData()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Já existe um registro para este mês/ano')
      } else {
        toast.error('Erro ao salvar caixa')
      }
      console.error('Error saving monthly cash:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!isAdmin) {
      toast.error('Apenas administradores podem realizar esta ação')
      return
    }

    if (!confirm('Deseja realmente excluir este registro?')) return

    try {
      const { error } = await supabase
        .from('monthly_cash')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Caixa excluído com sucesso')
      loadDashboardData()
    } catch (error) {
      toast.error('Erro ao excluir caixa')
      console.error('Error deleting monthly cash:', error)
    }
  }

  function openInvestmentDialog() {
    setInvestmentValue(data.investment.toString())
    setIsInvestmentDialogOpen(true)
  }

  async function handleSaveInvestment() {
    if (!isAdmin) {
      toast.error('Apenas administradores podem realizar esta ação')
      return
    }

    const value = parseFloat(investmentValue)
    if (isNaN(value)) {
      toast.error('Digite um valor válido')
      return
    }

    try {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', 'investment')

      if (error) throw error
      toast.success('Investimento atualizado com sucesso')
      setIsInvestmentDialogOpen(false)
      loadDashboardData()
    } catch (error) {
      toast.error('Erro ao atualizar investimento')
      console.error('Error updating investment:', error)
    }
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentMonthName = getMonthName(currentMonth)

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title={`Caixa Atual (${currentMonthName})`}
            value={formatCurrency(monthlyCash.find(c => c.month === currentMonth && c.year === currentYear)?.amount || 0)}
            subtitle="Saldo em caixa"
            icon={Wallet}
            iconColor="text-green-600"
            onEdit={isAdmin ? openCashDialog : undefined}
          />
          <DashboardCard
            title="Investimento"
            value={formatCurrency(data.investment)}
            subtitle="Valor aplicado"
            icon={TrendingUp}
            iconColor="text-blue-600"
            onEdit={isAdmin ? openInvestmentDialog : undefined}
          />
          <DashboardCard
            title="Entrada Mensal"
            value={formatCurrency(data.monthlyIncome)}
            subtitle="Total do mês atual"
            icon={DollarSign}
            iconColor="text-purple-600"
          />
          <DashboardCard
            title="Filhos da Casa"
            value={data.activeMembers}
            subtitle="Membros ativos"
            icon={Users}
            iconColor="text-orange-600"
          />
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Caixa da Casa
              </CardTitle>
              {isAdmin && (
                <Button
                  onClick={() => openDialog()}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {monthlyCash.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  {isAdmin
                    ? 'Nenhum registro encontrado.'
                    : 'Nenhum registro encontrado.'}
                </p>
              ) : (
                monthlyCash.map((item) => (
                  <div
                    key={item.id}
                    onClick={isAdmin ? () => openDialog(item) : undefined}
                    className={`flex items-center justify-between py-2 px-1 ${
                      isAdmin ? 'cursor-pointer hover:bg-gray-50 rounded' : ''
                    }`}
                  >
                    <span className="text-sm text-gray-700">
                      {getMonthName(item.month)}
                    </span>
                    <span className={`text-sm font-medium ${
                      item.amount >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCash ? 'Editar Caixa' : 'Adicionar Caixa'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mês</Label>
                <div className="text-lg font-semibold text-gray-700">
                  {getMonthName(formData.month)} de {formData.year}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {editingCash?.id && (
                <Button
                  onClick={() => {
                    handleDelete(editingCash.id!)
                    setIsDialogOpen(false)
                  }}
                  variant="destructive"
                >
                  Excluir
                </Button>
              )}
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Investimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="investment">Valor do Investimento (R$)</Label>
                <Input
                  id="investment"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={investmentValue}
                  onChange={(e) => setInvestmentValue(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsInvestmentDialogOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSaveInvestment} className="bg-blue-600 hover:bg-blue-700">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Caixa Atual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mês</Label>
                <div className="text-lg font-semibold text-gray-700">
                  {currentMonthName} de {currentYear}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash">Valor do Caixa (R$)</Label>
                <Input
                  id="cash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsCashDialogOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSaveCash} className="bg-green-600 hover:bg-green-700">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedLayout>
  )
}
