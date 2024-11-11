import { Component } from '@angular/core';
import { FormBuilder, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-people-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './people-form.component.html',
  styleUrl: './people-form.component.scss'
})
export class PeopleFormComponent {
  public form: FormGroup = new FormGroup({});

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [null],
      arreglo: this.fb.array([])
    })
  }

  agregarTelefonoCorreo() {
    const arreglo = this.form.get('arreglo') as FormArray;

    const grupo = this.fb.group({
      telefono: [null],
      correo: [null]
    })

    arreglo.push(grupo);
  }

  borrarGrupo(i: number) {
    const arreglo = this.form.get('arreglo') as FormArray;
    arreglo.removeAt(i);
 }

}
