'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Lock, LogOut, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Header() {
  const { isAdmin, loginAdmin, logout } = useAuth()
  const currentDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    const success = loginAdmin(password)
    if (success) {
      setPassword('')
      setError('')
      setIsLoginOpen(false)
    } else {
      setError('Senha incorreta')
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-white border-b border-purple-100 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-900">Controle Financeiro</h1>

          <div className="flex items-center gap-6">
            <span className="text-sm text-purple-600 font-medium">{currentDate}</span>

            {isAdmin ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-lg">
                  <Shield className="h-4 w-4 text-purple-700" />
                  <span className="text-sm font-medium text-purple-900">Admin</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginOpen(true)}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Lock className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Administrativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="border-purple-200 focus:border-purple-500"
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
            <Button
              onClick={handleLogin}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Entrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
