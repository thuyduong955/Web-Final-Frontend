import { useCallback } from 'react'
import type { ComponentType, SVGProps } from 'react'
import AnalyticsIcon from '../assets/icons/analytics_icon.svg?react'
import CalendarIcon from '../assets/icons/calendar_icon.svg?react'
import HelpIcon from '../assets/icons/help_icon.svg?react'
import HomeIcon from '../assets/icons/home_icon.svg?react'
import LessonIcon from '../assets/icons/lesson_icon.svg?react'
import LogoutIcon from '../assets/icons/logout_icon.svg?react'
import SettingIcon from '../assets/icons/setting_icon.svg?react'
import TrainingIcon from '../assets/icons/training1v1_icon.svg?react'
import AvatarImage from '../assets/sidebar-avatar.png'
import './SidebarNav.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'training1v1', label: '1v1 Training', icon: 'training1v1' },
  { id: 'library', label: 'Lessons', icon: 'library' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
] as const

const FOOTER_ITEMS = [
  { id: 'support', label: 'Support', icon: 'help' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'logout', label: 'Log out', icon: 'logout', tone: 'danger' as const },
] satisfies ReadonlyArray<{
  readonly id: 'support' | 'settings' | 'logout'
  readonly label: string
  readonly icon: IconName
  readonly tone?: 'danger'
}>

const ICON_COMPONENTS = {
  home: HomeIcon,
  training1v1: TrainingIcon,
  library: LessonIcon,
  calendar: CalendarIcon,
  analytics: AnalyticsIcon,
  help: HelpIcon,
  settings: SettingIcon,
  logout: LogoutIcon,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>

type IconName = keyof typeof ICON_COMPONENTS

type PrimaryNavId = (typeof NAV_ITEMS)[number]['id']
type FooterNavId = (typeof FOOTER_ITEMS)[number]['id']
export type SidebarNavId = PrimaryNavId | FooterNavId

interface IconProps {
  name: IconName
  active?: boolean
}

interface SidebarNavProps {
  activeId?: SidebarNavId | null
  onChange?: (id: SidebarNavId) => void
  onAvatarClick?: () => void
}

function Icon({ name, active }: IconProps) {
  const IconComponent = ICON_COMPONENTS[name]
  if (!IconComponent) return null

  return <IconComponent aria-hidden="true" className={`sidebar-icon ${active ? 'is-active' : ''}`} />
}

export function SidebarNav({ activeId, onChange, onAvatarClick }: SidebarNavProps) {
  const handleClick = useCallback(
    (nextId: SidebarNavId) => {
      if (onChange) {
        onChange(nextId)
      }
    },
    [onChange],
  )

  return (
    <aside className="sidebar-nav" aria-label="Sidebar">
      <div className="sidebar-nav__top">
        <button
          type="button"
          className="sidebar-nav__avatar"
          aria-label="Open profile"
          onClick={onAvatarClick}
        >
          <img src={AvatarImage} alt="Avatar" className="sidebar-nav__avatar-img" draggable="false" />
        </button>

        <div className="sidebar-nav__divider" />

        <nav className="sidebar-nav__stack" aria-label="Quick navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeId != null && item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                className={`sidebar-nav__item ${isActive ? 'is-active' : ''}`}
                onClick={() => handleClick(item.id)}
                aria-pressed={isActive}
              >
                <Icon name={item.icon} active={isActive} />
              </button>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-nav__footer" aria-label="Additional actions">
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            className={`sidebar-nav__item sidebar-nav__item--small ${activeId != null && item.id === activeId ? 'is-active' : ''} ${item.tone === 'danger' ? 'is-danger' : ''}`.trim()}
            onClick={() => handleClick(item.id)}
          >
            <Icon name={item.icon} active={activeId != null && item.id === activeId} />
          </button>
        ))}
      </div>
    </aside>
  )
}

export default SidebarNav
