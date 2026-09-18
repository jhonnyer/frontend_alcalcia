import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoriasService } from '../../../core/services/categorias.service';
import { Router } from '@angular/router';
import { PageTitleService } from '../../../core/services/pageTitle.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ICategorias } from '../../../core/models/categorias.model';
import { ConfirmDialogComponent } from '../../nucleo/components/confirm-accion-dialog/confirm-dialog.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-categorias-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: ``,
  templateUrl: './categorias-create.component.html'
})
export class CategoriasCreateComponent {
  constructor(private dialog: MatDialog) {}
  public formFamilyCore: FormGroup = new FormGroup({});
  private fb = inject(FormBuilder);
  private categoriasService = inject(CategoriasService);
  private router = inject(Router);
  private pageTitleService = inject(PageTitleService);
  private data = inject(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<CategoriasCreateComponent>, { optional: true });
  public idProyecto?: number;
  public modo: 'crear' | 'editar' = 'crear';
  public categoriaId?: number;
  public isSaving = false;
  public isConfirming = false;
  private alert = inject(AlertService);
  

  ngOnInit(): void {
    this.pageTitleService.setCurrentPage('Gestión de Categoría');
    
    // ✅ Inicializa primero el formulario
    this.initFormFamilyCore();

    if (this.data) {
      this.idProyecto = this.data.idProyecto;
      this.modo = this.data.modo || 'crear';

      // 🔹 Si es editar, setear valores después de tener el formulario inicializado
      if (this.modo === 'editar' && this.data.categoria) {
        const categoria = this.data.categoria as ICategorias;
        this.categoriaId = categoria.idCategoria;

        // ✅ Cargar los datos existentes en el formulario
        this.formFamilyCore.patchValue({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion
        });
      }
    }
  }


  initFormFamilyCore(): void {
    this.formFamilyCore = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
    });
  }

  // Referencia cada campo que se crea en el html
  getCtrl(key: string, form: FormGroup): FormArray {
    return form.get(key) as FormArray;
  }

  onSubmit(): void {
    if (this.isSaving) return;

    if (this.formFamilyCore.invalid) {
      this.formFamilyCore.markAllAsTouched();
      return;
    }

    const payload: Partial<ICategorias> = {
      ...this.formFamilyCore.value,
      ...(this.idProyecto ? { idProyecto: this.idProyecto } : {})
    };

    // 🟦 Editar
    if (this.modo === 'editar' && this.categoriaId) {
      this.isSaving = true;
      this.categoriasService.updateById(String(this.categoriaId), payload).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.alert.success('Operación exitosa','✅ Categoría actualizada correctamente');
          if (this.dialogRef) {
            this.dialogRef.close(response);
          } else {
            this.router.navigate(['/categorias']);
          }
        },
        error: (error) => {
          this.isSaving = false;
          console.error('❌ Error al actualizar la categoría:', error);
          this.alert.error('Operación fallida','⚠️ No se pudo actualizar la categoría. Intenta nuevamente.');
        }
      });

    // 🟩 Crear
    } else {
      this.isSaving = true;
      this.categoriasService.post(payload).subscribe({
        next: (response) => {
          this.isSaving = false;
          this.alert.success('Operación exitosa','✅ Categoría creada correctamente');
          if (this.dialogRef) {
            this.dialogRef.close(response);
          } else {
            this.router.navigate(['/projects/update', this.idProyecto]);
          }
        },
        error: (error) => {
          this.isSaving = false;
          console.error('❌ Error al crear la categoría:', error);
          this.alert.error('Operación fallida','⚠️ No se pudo crear la categoría. Verifica los datos e intenta nuevamente.');
        }
      });
    }
  }

  confirmarGuardarCategoria(): void {
    if (this.isSaving || this.isConfirming) return;

    if (this.formFamilyCore.invalid) {
      this.alert.warning('Formulario Inválido','⚠️ Verifica los campos del formulario');
      this.formFamilyCore.markAllAsTouched();
      return;
    }

    const mensaje =
      this.modo === 'editar'
        ? '¿Deseas guardar los cambios de esta categoría?'
        : '¿Deseas crear esta nueva categoría?';

    this.isConfirming = true;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { mensaje }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      this.isConfirming = false;
      if (confirmado) {
        this.onSubmit(); // Ejecuta la lógica normal
      }
    });
  }

  cancelar() {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/categorias']);
    }
  }

}
