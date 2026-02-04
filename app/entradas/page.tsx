'use client'

import { useEffect, useState, useMemo } from 'react'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getMonthName } from '@/lib/formatters'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { debounce } from '@/lib/debounce'

interface Income {
  id: string
  description: string
  amount: number
  month: number
  year: number
  created_at: string
}

interface GroupedIncomes {
  [key: string]: Income[]
}

export default function EntradasPage() {
  const { isAdmin } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newIncome, setNewIncome] = useState({
    description: '',
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const debouncedLoadIncomes = useMemo(() => debounce(loadIncomes, 300), [])

  useEffect(() => {
    loadIncomes()

    const incomeSubscription = supabase
      .channel('income-changes-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income' }, () => {
        debouncedLoadIncomes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(incomeSubscription)
    }
  }, [debouncedLoadIncomes])

  async function loadIncomes() {
    const { data } = await supabase
      .from('income')
      .select('*')
      .is('related_payment_id', null)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('description', { ascending: true })

    setIncomes(data || [])
  }

  async function handleAddIncome() {
    if (!newIncome.description.trim() || newIncome.amount <= 0) return

    const { error } = await supabase
      .from('income')
      .insert([{
        description: newIncome.description.trim(),
        amount: newIncome.amount,
        month: newIncome.month,
        year: newIncome.year
      }])

    if (!error) {
      setNewIncome({
        description: '',
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      })
      setIsAddOpen(false)
      loadIncomes()
    }
  }

  async function handleDeleteIncome(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) return

    await supabase.from('income').delete().eq('id', id)
    loadIncomes()
  }

  const groupedIncomes = useMemo(() => {
    const grouped: GroupedIncomes = {}
    incomes.forEach(income => {
      const key = `${income.year}-${income.month}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(income)
    })
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.description.localeCompare(b.description))
    })
    return grouped
  }, [incomes])

  const sortedMonthKeys = Object.keys(groupedIncomes).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number)
    const [yearB, monthB] = b.split('-').map(Number)
    if (yearB !== yearA) return yearB - yearA
    return monthB - monthA
  })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Controle de Entradas</h1>
            <p className="text-gray-600 mt-1">Receitas mensais da casa</p>
          </div>

          {isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Entrada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                    placeholder="Ex: Doação, Venda, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="month">Mês</Label>
                    <Select
                      value={newIncome.month.toString()}
                      onValueChange={(v) => setNewIncome({ ...newIncome, month: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString()}>
                            {getMonthName(month)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Ano</Label>
                    <Select
                      value={newIncome.year.toString()}
                      onValueChange={(v) => setNewIncome({ ...newIncome, year: parseInt(v) })}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>
                <Button onClick={handleAddIncome} className="w-full bg-blue-600 hover:bg-blue-700">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {sortedMonthKeys.length === 0 ? (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="py-12">
                <p className="text-center text-gray-500">
                  Nenhuma entrada registrada
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedMonthKeys.map(key => {
              const [year, month] = key.split('-').map(Number)
              const monthIncomes = groupedIncomes[key]
              const total = monthIncomes.reduce((sum, item) => sum + Number(item.amount), 0)

              return (
                <Card key={key} className="border-gray-200 shadow-sm bg-gradient-to-r from-purple-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {getMonthName(month)}
                      </h2>
                      <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-semibold">
                        Total: {formatCurrency(total)}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 border-b border-gray-200">
                        <div className="font-semibold text-gray-700">Descrição</div>
                        <div className="font-semibold text-gray-700 text-right">Valor</div>
                      </div>

                      {monthIncomes.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          Sem entradas registradas
                        </div>
                      ) : (
                        monthIncomes.map(income => (
                          <div
                            key={income.id}
                            className="grid grid-cols-2 gap-4 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900">{income.description}</span>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteIncome(income.id)}
                                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0 ml-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="text-right font-semibold text-green-600">
                              {formatCurrency(income.amount)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
