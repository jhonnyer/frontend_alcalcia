import { TestBed } from '@angular/core/testing';
import { CanMatchFn } from '@angular/router';

import { hasRoleGuardGuard } from './has-role-guard.guard';

describe('hasRoleGuardGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => hasRoleGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
