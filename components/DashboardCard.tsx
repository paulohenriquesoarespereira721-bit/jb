import { LucideIcon, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  onEdit?: () => void
}

export function DashboardCard({ title, value, subtitle, icon: Icon, iconColor = 'text-purple-600', onEdit }: DashboardCardProps) {
  return (
    <Card className="border-purple-100 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-purple-900">{value}</div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {onEdit && (
            <Button
              onClick={onEdit}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 ml-2"
            >
              <Edit2 className="h-4 w-4 text-gray-500 hover:text-purple-600" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
