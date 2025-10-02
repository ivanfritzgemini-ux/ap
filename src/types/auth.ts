import { checkPermission } from '@/utils/permissions';

// In your component
if (checkPermission(userRole, 'create:grades')) {
  // Show grade creation UI
}