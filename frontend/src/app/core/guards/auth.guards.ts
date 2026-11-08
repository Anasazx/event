import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { MembershipService } from '../auth/membership.service';
import { StaffRole, UserRole } from '../models';

/** Protected pages: signed-in users only. Keeps the requested URL for after login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Login and register pages: signed-out users only. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) {
    return true;
  }
  const router = inject(Router);
  const membership = inject(MembershipService);
  return router.createUrlTree([auth.homeFor(auth.user(), membership.approved())]);
};

/** Pages restricted to given platform roles (USER, ORGANIZER, ADMIN). */
export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    return roles.includes(auth.role() as UserRole) ? true : router.createUrlTree(['/']);
  };
}

/**
 * Organizer workspace: the user must have an APPROVED membership.
 * Pending or no membership is redirected to the setup page.
 */
export const organizerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const membership = inject(MembershipService);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  return membership.ensureLoaded().pipe(
    map(() => (membership.approved() ? true : router.createUrlTree(['/organizer/setup']))),
  );
};

/**
 * Pages that need a staff role inside the organization. The allowed roles are listed in the
 * route data as `staffRoles`, e.g. { path: 'check-in', canActivate: [staffRoleGuard], data: { staffRoles: ['MODERATOR', 'ORGANIZER', 'CHECK_IN'] } }
 */
export const staffRoleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const membership = inject(MembershipService);
  const allowed = (route.data['staffRoles'] as StaffRole[] | undefined) ?? [];
  return membership
    .ensureLoaded()
    .pipe(
      map(() => {
        const role = membership.role();
        return membership.approved() && (allowed.length === 0 || allowed.includes(role as StaffRole))
          ? true
          : router.createUrlTree(['/organizer']);
      }),
    );
};
