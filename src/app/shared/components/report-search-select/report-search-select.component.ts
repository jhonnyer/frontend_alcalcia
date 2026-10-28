import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';

export interface ReportSearchOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-report-search-select',
  standalone: true,
  imports: [FormsModule, MatAutocompleteModule, MatIconModule],
  template: `
    <div class="search-control" matAutocompleteOrigin #origin="matAutocompleteOrigin">
      <input type="text" class="input-base" [attr.aria-label]="label" [placeholder]="placeholder"
        [title]="selectedLabel" [disabled]="disabled" [ngModel]="search"
        (ngModelChange)="onSearch($event)" [matAutocomplete]="choices" [matAutocompleteConnectedTo]="origin" autocomplete="off"
        [attr.aria-invalid]="editing && !!search" />
      @if (search) {
        <button type="button" class="clear-search" [disabled]="disabled" (click)="clear()"
          [attr.aria-label]="'Limpiar ' + label" [title]="'Limpiar ' + label">
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
    <mat-autocomplete #choices="matAutocomplete" class="report-search-panel"
      [displayWith]="displayValue" (optionSelected)="select($event.option.value)">
      @for (option of filteredOptions; track option.value) {
        <mat-option [value]="option.value"><span class="option-label">{{ option.label }}</span></mat-option>
      } @empty {
        <mat-option disabled>Sin coincidencias</mat-option>
      }
    </mat-autocomplete>
  `,
  styles: [`
    :host { display: block; min-width: 0; width: 100%; }
    .search-control { display: flex; align-items: center; gap: .25rem; min-width: 0; }
    input { flex: 1; min-width: 0; width: 100%; text-overflow: ellipsis; }
    .clear-search { display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 2rem; height: 2rem; border-radius: 50%; color: #64748b; }
    .clear-search:hover { background: #e2e8f0; }
    .clear-search:focus-visible { outline: 2px solid #2563eb; }
    .clear-search mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .option-label { white-space: normal; overflow-wrap: anywhere; line-height: 1.4; display: block; }
  `]
})
export class ReportSearchSelectComponent implements OnChanges {
  @Input() options: ReportSearchOption[] = [];
  @Input() value: string | null = null;
  @Input() label = '';
  @Input() placeholder = 'Buscar';
  @Input() disabled = false;
  @Input() resetKey = 0;
  @Output() valueChange = new EventEmitter<string | null>();
  @Output() searchValidChange = new EventEmitter<boolean>();
  search = '';
  editing = false;

  get selectedLabel(): string {
    return this.options.find(option => option.value === this.value)?.label ?? '';
  }

  get filteredOptions(): ReportSearchOption[] {
    const query = this.normalize(this.editing ? this.search : '');
    return this.options.filter(option => !query || this.normalize(option.label).includes(query));
  }

  readonly displayValue = (value: string): string =>
    this.options.find(option => option.value === value)?.label ?? value ?? '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetKey']) {
      this.editing = false;
      this.searchValidChange.emit(true);
    }
    if (!this.editing) this.search = this.selectedLabel;
  }

  onSearch(value: string): void {
    this.search = value;
    this.editing = true;
    this.value = null;
    this.valueChange.emit(null);
    this.searchValidChange.emit(!value.trim());
  }

  select(value: string): void {
    this.editing = false;
    this.value = value;
    this.search = this.selectedLabel;
    this.valueChange.emit(value);
    this.searchValidChange.emit(true);
  }

  clear(): void {
    this.editing = false;
    this.search = '';
    this.value = null;
    this.valueChange.emit(null);
    this.searchValidChange.emit(true);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
}
