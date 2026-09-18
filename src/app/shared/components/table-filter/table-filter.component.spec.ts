import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableFilterComponent } from './table-filter.component';
import { Column } from '@tanstack/angular-table';
import { By } from '@angular/platform-browser';

describe('TableFilterComponent', () => {
  let component: TableFilterComponent;
  let fixture: ComponentFixture<TableFilterComponent>;
  let mockColumn: jasmine.SpyObj<Column<any, any>>;

  beforeEach(async () => {
    // Creamos el mock de la columna
    mockColumn = jasmine.createSpyObj('Column', ['setFilterValue']);

    await TestBed.configureTestingModule({
      imports: [TableFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TableFilterComponent);
    component = fixture.componentInstance;

    // Asignamos el mock al signal
    (component as any).column = () => mockColumn;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  // Prueba de integración del input con el evento
  it('should filter when user types in input', () => {
    // Arrange
    const inputElement = fixture.debugElement.query(
      By.css('input')
    ).nativeElement as HTMLInputElement;

    // Act
    inputElement.value = 'test value';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: inputElement });

    component.onInputChange(event);
    fixture.detectChanges();

    // Assert
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith('test value');
  });

  // Prueba del placeholder del input
  it('should have placeholder text in input', () => {
    const inputElement = fixture.debugElement.query(
      By.css('input')
    ).nativeElement as HTMLInputElement;

    expect(inputElement.placeholder).toBe('Buscar...');
  });

  // Prueba de las clases CSS
  it('should have correct CSS classes', () => {
    const inputElement = fixture.debugElement.query(
      By.css('input')
    ).nativeElement as HTMLInputElement;

    expect(inputElement.className).toContain('input');
    expect(inputElement.className).toContain('w-full');
    expect(inputElement.className).toContain('text-sm');
    expect(inputElement.className).toContain('border');
    expect(inputElement.className).toContain('shadow');
    expect(inputElement.className).toContain('rounded');
    expect(inputElement.className).toContain('px-1');
  });

  // Prueba de múltiples eventos de input
  it('should handle multiple input changes', () => {
    // Arrange
    const values = ['test1', 'test2', 'test3'];

    // Act & Assert
    values.forEach(value => {
      const inputElement = document.createElement('input');
      inputElement.value = value;
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: inputElement });

      component.onInputChange(event);

      expect(mockColumn.setFilterValue).toHaveBeenCalledWith(value);
    });

    expect(mockColumn.setFilterValue).toHaveBeenCalledTimes(values.length);
  });

  // Prueba de valor vacío
  it('should handle empty input value', () => {
    // Arrange
    const inputElement = document.createElement('input');
    inputElement.value = '';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: inputElement });

    // Act
    component.onInputChange(event);

    // Assert
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(undefined);
  });
});
