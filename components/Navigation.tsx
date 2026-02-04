'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/mensalidades', label: 'Mensalidades', icon: Users },
  { href: '/gastos', label: 'Gastos', icon: TrendingDown },
  { href: '/entradas', label: 'Entradas', icon: TrendingUp },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-purple-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'text-purple-700'
                    : 'text-gray-600 hover:text-purple-600'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-700" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
