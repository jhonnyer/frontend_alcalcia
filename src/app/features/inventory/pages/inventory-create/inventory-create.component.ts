import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './inventory-create.component.html'
})
export class InventoryCreateComponent {
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initFormFamilyCore();

  }

  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      proyecto: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      productos: this.fb.array([], [Validators.required, Validators.min(1)])
    });
    this.addProducts();
  }

  initFormProducts(): FormGroup {
    // Retorna el formulario que estará anidado
    return this.fb.group({
      nombre: ['', [Validators.required]],
      stock: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
    });
  }

  //Agrega un nuevo formulario anidado de Persona
  addProducts(): void {
    const refProducts = this.formFamilyCore.get('productos') as FormArray;
    refProducts.push(this.initFormProducts());
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  get productosFormArray(): FormArray {
    return this.formFamilyCore.get('productos') as FormArray;
  }

  deleteProduct(index: number): void {
    const productosArray = this.formFamilyCore.get('productos') as FormArray;
    productosArray.removeAt(index);
  }


  onSubmit() {
    if(this.formFamilyCore.valid){
      console.log("Form");
      console.log(this.formFamilyCore.value);
	  }else{
      console.log('Formulario inválido');
      console.log(this.formFamilyCore.value);
		  this.formFamilyCore.markAllAsTouched();
	  }
  }
}
