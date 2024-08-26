import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DebounceService {
  private debounceSubject = new Subject<() => void>();
  private debounce$: Observable<() => void>;

  constructor() {
    this.debounce$ = this.debounceSubject.pipe(
      debounceTime(300)
    );

    this.debounce$.subscribe(fn => fn());
  }

  debounce(fn: () => void) {
    this.debounceSubject.next(fn);
  }
}