import { Routes } from '@angular/router';
import { authGuard, guestGuard, organizerGuard, roleGuard, staffRoleGuard } from './core/guards/auth.guards';
import { ShellComponent } from './layout/shell.component';

/**
 * Every page is lazy loaded. Guards are a UX convenience; the API enforces every rule.
 * Route order matters: static segments (e.g. "events/new") must come before "events/:id".
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · EventHub',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Create account · EventHub',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        title: 'EventHub · Discover events',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'events',
        title: 'Events · EventHub',
        loadComponent: () => import('./features/events/event-list/event-list.component').then((m) => m.EventListComponent),
      },
      {
        path: 'events/:id',
        title: 'Event · EventHub',
        loadComponent: () => import('./features/events/event-detail/event-detail.component').then((m) => m.EventDetailComponent),
      },
      {
        path: 'organizations',
        title: 'Organizations · EventHub',
        loadComponent: () =>
          import('./features/organizations/organization-list/organization-list.component').then((m) => m.OrganizationListComponent),
      },
      {
        path: 'organizations/:id',
        title: 'Organization · EventHub',
        loadComponent: () =>
          import('./features/organizations/organization-detail/organization-detail.component').then((m) => m.OrganizationDetailComponent),
      },
      {
        path: 'venues',
        title: 'Venues · EventHub',
        loadComponent: () => import('./features/venues/venue-list/venue-list.component').then((m) => m.VenueListComponent),
      },

      // ---- Signed-in attendee area ----
      {
        path: 'account',
        canActivate: [authGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'profile' },
          {
            path: 'profile',
            title: 'Profile · EventHub',
            loadComponent: () => import('./features/account/profile/profile.component').then((m) => m.ProfileComponent),
          },
          {
            path: 'tickets',
            title: 'My tickets · EventHub',
            loadComponent: () => import('./features/account/my-tickets/my-tickets.component').then((m) => m.MyTicketsComponent),
          },
          {
            path: 'reviews',
            title: 'My reviews · EventHub',
            loadComponent: () => import('./features/account/my-reviews/my-reviews.component').then((m) => m.MyReviewsComponent),
          },
          {
            path: 'notifications',
            title: 'Notifications · EventHub',
            loadComponent: () =>
              import('./features/account/notifications/notifications.component').then((m) => m.NotificationsComponent),
          },
        ],
      },

      // ---- Organizer workspace ----
      {
        path: 'organizer/setup',
        canActivate: [authGuard],
        title: 'Your organization · EventHub',
        loadComponent: () =>
          import('./features/organizer/organization-setup/organization-setup.component').then((m) => m.OrganizationSetupComponent),
      },
      {
        path: 'organizer',
        canActivate: [organizerGuard],
        children: [
          {
            path: '',
            title: 'Organizer dashboard · EventHub',
            loadComponent: () =>
              import('./features/organizer/organizer-dashboard/organizer-dashboard.component').then((m) => m.OrganizerDashboardComponent),
          },
          {
            path: 'events',
            title: 'Manage events · EventHub',
            loadComponent: () =>
              import('./features/organizer/manage-events/manage-events.component').then((m) => m.ManageEventsComponent),
          },
          {
            path: 'events/new',
            title: 'New event · EventHub',
            loadComponent: () =>
              import('./features/organizer/event-form/event-form.component').then((m) => m.EventFormComponent),
          },
          {
            path: 'events/:id/edit',
            title: 'Edit event · EventHub',
            loadComponent: () =>
              import('./features/organizer/event-form/event-form.component').then((m) => m.EventFormComponent),
          },
          {
            path: 'events/:id',
            title: 'Event management · EventHub',
            loadComponent: () =>
              import('./features/organizer/event-manage/event-manage.component').then((m) => m.EventManageComponent),
          },
          {
            path: 'check-in',
            title: 'Check-in · EventHub',
            canActivate: [staffRoleGuard],
            data: { staffRoles: ['MODERATOR', 'ORGANIZER', 'CHECK_IN'] },
            loadComponent: () => import('./features/organizer/check-in/check-in.component').then((m) => m.CheckInComponent),
          },
          {
            path: 'team',
            title: 'Team · EventHub',
            loadComponent: () => import('./features/organizer/team/team.component').then((m) => m.TeamComponent),
          },
          {
            path: 'settings',
            title: 'Organization settings · EventHub',
            loadComponent: () =>
              import('./features/organizer/organization-settings/organization-settings.component').then(
                (m) => m.OrganizationSettingsComponent,
              ),
          },
        ],
      },

      // ---- Administration ----
      {
        path: 'admin',
        canActivate: [roleGuard('ADMIN')],
        children: [
          {
            path: '',
            title: 'Administration · EventHub',
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
          },
          {
            path: 'users',
            title: 'Users · EventHub',
            loadComponent: () => import('./features/admin/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
          },
          {
            path: 'organizations',
            title: 'Organizations admin · EventHub',
            loadComponent: () =>
              import('./features/admin/admin-organizations/admin-organizations.component').then((m) => m.AdminOrganizationsComponent),
          },
          {
            path: 'categories',
            title: 'Categories · EventHub',
            loadComponent: () =>
              import('./features/admin/admin-categories/admin-categories.component').then((m) => m.AdminCategoriesComponent),
          },
          {
            path: 'venues',
            title: 'Venues admin · EventHub',
            loadComponent: () => import('./features/admin/admin-venues/admin-venues.component').then((m) => m.AdminVenuesComponent),
          },
        ],
      },
      {
        path: '**',
        title: 'Page not found · EventHub',
        loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
