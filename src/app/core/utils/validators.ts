import { AbstractControl, ValidationErrors } from '@angular/forms';

export class MyValidators {

  static validIsoDate(control: AbstractControl): ValidationErrors | null {
    const value: unknown = control.value;
    if (value === null || value === '') return null;
    if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { invalidDate: true };
    }
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
      ? null
      : { invalidDate: true };
  }


  static validPassword(control: AbstractControl){
    const value = control.value;

    if(!containsNumber(value)){
      return {invalid_password: true};
    }
    return null;
  }

  static matchPasswords(control: AbstractControl){
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if(password !== confirmPassword){
      return {match_password: true};
    }
    return null;
  }
}

function containsNumber(value: string){
  return value.split('').find(v => isNumber(v)) !== undefined;
}

function isNumber(value: string){
  return !isNaN(parseInt(value, 10));
}
