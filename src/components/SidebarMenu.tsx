import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menuItems, MenuItem } from '@/config/menu';
import { Role } from '@/types/roles';
import { hasPermission } from '@/middleware/auth';

interface SidebarMenuProps {
  className?: string;
}

export default function SidebarMenu({ className = '' }: SidebarMenuProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role as Role;

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    // If no permission is required, show the item
    if (!item.permission) return true;
    // Otherwise, check if user has the required permission
    return hasPermission(userRole, item.permission);
  });

  // Helper to check if a menu item is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path);
    const activeClass = active ? 'bg-primary-100 text-primary-900' : 'hover:bg-gray-100';

    return (
      <li key={item.path}>
        <Link
          href={item.path}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${activeClass}`}
        >
          {item.icon && (
            <span className="mr-3">
              <i className={`icon-${item.icon}`} />
            </span>
          )}
          <span>{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav className={`sidebar-menu ${className}`}>
      <ul className="space-y-1">
        {filteredMenuItems.map(renderMenuItem)}
      </ul>
    </nav>
  );
}