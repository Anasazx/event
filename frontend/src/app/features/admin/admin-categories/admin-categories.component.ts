import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { errorMessage } from '../../../core/api/api-error';
import { fileUrl } from '../../../core/api/api-url';
import { applyServerErrors } from '../../../core/api/form-errors';
import { CategoryRequest, CategoryResponse } from '../../../core/models';
import { CategoryService } from '../../../core/services/catalog.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, ImageUploadComponent, ModalComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, EmptyStateComponent, ErrorStateComponent, IconComponent, ImageUploadComponent, ModalComponent, PageHeaderComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Administration" title="Categories" subtitle="Categories help attendees browse events by topic.">
      <button class="btn btn-primary" type="button" (click)="openEditor(null)"><app-icon name="plus" [size]="16" /> New category</button>
    </app-page-header>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (categories() === null) {
      <div class="grid"><app-skeleton variant="card" [count]="4" /></div>
    } @else if (categories()!.length === 0) {
      <app-empty-state icon="tag" title="No categories yet" message="Create the first category to classify events." />
    } @else {
      <div class="grid">
        @for (c of categories(); track c.id) {
          <article class="card cat">
            @if (c.image) { <img class="cat__img" [src]="fileUrl(c.image)" [alt]="c.name" /> }
            <div class="cat__body">
              <h2>{{ c.name }}</h2>
              <p class="muted">{{ c.description || 'No description' }}</p>
            </div>
            <div class="cat__actions">
              <button class="btn btn-ghost btn-sm" type="button" (click)="openEditor(c)">Edit</button>
              <button class="btn btn-ghost btn-sm" type="button" (click)="remove(c)">Delete</button>
            </div>
          </article>
        }
      </div>
    }

    <app-modal [open]="editing() !== undefined" [title]="editing() ? 'Edit category' : 'New category'" (closed)="editing.set(undefined)">
      <form id="category-form" class="stack" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <label class="field">
          <span class="label">Name</span>
          <input class="input" formControlName="name" maxlength="80" [class.is-invalid]="form.controls.name.invalid && form.controls.name.touched" />
          @if (form.controls.name.invalid && form.controls.name.touched) { <span class="form-error">Name is required.</span> }
        </label>
        <label class="field">
          <span class="label">Description</span>
          <textarea class="textarea" rows="3" formControlName="description" maxlength="500"></textarea>
        </label>
        <app-image-upload label="Image" [value]="image()" (valueChange)="image.set($event)" />
        @if (formError(); as message) { <div class="alert alert--danger" role="alert">{{ message }}</div> }
      </form>
      <div modal-footer>
        <button class="btn btn-ghost" type="button" (click)="editing.set(undefined)">Cancel</button>
        <button class="btn btn-primary" type="submit" form="category-form" [disabled]="busy()">Save category</button>
      </div>
    </app-modal>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .cat { display: flex; flex-direction: column; overflow: hidden; }
    .cat__img { width: 100%; height: 120px; object-fit: cover; }
    .cat__body { padding: 0.9rem 1rem 0.4rem; }
    .cat__body h2 { font-size: 1.05rem; margin-bottom: 0.2rem; }
    .cat__body p { font-size: 0.9rem; margin: 0; }
    .cat__actions { display: flex; gap: 0.35rem; padding: 0.6rem 0.8rem 0.9rem; margin-top: auto; }
  `,
})
export class AdminCategoriesComponent {
  private readonly categoriesApi = inject(CategoryService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fileUrl = fileUrl;
  protected readonly categories = signal<CategoryResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  /** undefined = closed, null = creating, value = editing */
  protected readonly editing = signal<CategoryResponse | null | undefined>(undefined);
  protected readonly image = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.categoriesApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.categories.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Categories could not be loaded.')),
      });
  }

  protected openEditor(category: CategoryResponse | null): void {
    this.formError.set(null);
    this.form.reset({ name: category?.name ?? '', description: category?.description ?? '' });
    this.image.set(category?.image ?? null);
    this.editing.set(category);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: CategoryRequest = { name: raw.name.trim(), description: raw.description.trim() || null, image: this.image() };
    const current = this.editing();
    this.busy.set(true);
    const request = current ? this.categoriesApi.update(current.id, body) : this.categoriesApi.create(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.editing.set(undefined);
        this.toast.success('Category saved.');
        this.load();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        applyServerErrors(this.form, e);
        this.formError.set(errorMessage(e, 'The category could not be saved.'));
      },
    });
  }

  protected async remove(category: CategoryResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete "${category.name}"?`,
      message: 'Categories used by events cannot be deleted. Reassign those events first.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.categoriesApi
      .remove(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.categories.update((list) => (list ?? []).filter((c) => c.id !== category.id));
          this.toast.success('Category deleted.');
        },
        error: (e: unknown) => this.toast.error(errorMessage(e, 'The category could not be deleted.')),
      });
  }
}
