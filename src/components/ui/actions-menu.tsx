import { MoreVertical } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
  show?: boolean
}

export interface ActionGroup {
  items: ActionItem[]
}

interface ActionsMenuProps {
  actions: (ActionItem | ActionGroup)[]
  disabled?: boolean
  align?: 'start' | 'end' | 'center'
}

export function ActionsMenu({ actions, disabled = false, align = 'end' }: ActionsMenuProps) {
  // Filter out hidden actions and flatten groups
  const visibleActions = actions.flatMap((action) => {
    if ('items' in action) {
      return action.items.filter((item) => item.show !== false)
    }
    return (action as ActionItem).show !== false ? [action] : []
  })

  if (visibleActions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors"
        disabled={disabled}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[200px]">
        {actions.map((action, groupIndex) => {
          if ('items' in action) {
            // Action group
            const visibleItems = action.items.filter((item) => item.show !== false)
            if (visibleItems.length === 0) return null

            return (
              <div key={groupIndex}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                {visibleItems.map((item, itemIndex) => (
                  <DropdownMenuItem
                    key={itemIndex}
                    onClick={item.onClick}
                    className={
                      item.variant === 'destructive'
                        ? 'gap-2 text-destructive focus:text-destructive'
                        : 'gap-2'
                    }
                  >
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </div>
            )
          } else {
            // Single action
            if (action.show === false) return null

            return (
              <DropdownMenuItem
                key={groupIndex}
                onClick={action.onClick}
                className={
                  action.variant === 'destructive'
                    ? 'gap-2 text-destructive focus:text-destructive'
                    : 'gap-2'
                }
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            )
          }
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
