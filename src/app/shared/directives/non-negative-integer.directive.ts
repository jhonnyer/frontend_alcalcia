import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[appNonNegativeInteger]',
  standalone: true
})
export class NonNegativeIntegerDirective {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly control = inject(NgControl, { self: true });
  private previousValue = '';

  @HostListener('focus')
  rememberValue(): void {
    const input = this.element.nativeElement;
    if (!input.validity.badInput && /^\d*$/.test(input.value)) {
      this.previousValue = input.value;
    }
  }

  @HostListener('keydown', ['$event'])
  preventInvalidKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length === 1 && !/^\d$/.test(event.key)) event.preventDefault();
  }

  @HostListener('beforeinput', ['$event'])
  preventInvalidInput(event: InputEvent): void {
    if (event.data && !/^\d+$/.test(event.data)) event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  preventInvalidPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text');
    if (text !== undefined && !/^\d+$/.test(text)) event.preventDefault();
  }

  @HostListener('input')
  validateInput(): void {
    const input = this.element.nativeElement;
    if (!input.validity.badInput && /^\d*$/.test(input.value)) {
      this.previousValue = input.value;
      return;
    }
    // Covers input methods that do not emit a cancellable beforeinput event.
    input.value = this.previousValue;
    this.control.control?.setValue(this.previousValue === '' ? null : Number(this.previousValue));
  }
}
