import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MonoTypeOperatorFunction, of, timer } from 'rxjs';
import { delay, map, catchError, retry, tap, scan, retryWhen } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'rxjs-errorhandling-debugging';

  loading: boolean = false;
  result: string | null = null;
  error: string | null = null;
  finalMessage: string | null = null;
  retryCount: number = 0;

  makeRequest() {
    this.loading = true;
    this.result = null;
    this.error = null;
    this.finalMessage = null;
    this.retryCount = 0;

    const httpRequest$ = timer(1000).pipe(
      delay(1000),
      map(() => {
        const randomSuccess = Math.random() > 0.5;
        if (!randomSuccess) {
          throw new Error('Simulated network error');
        }
        return 'Operation successful!';
      }),
      catchError(error => {
        this.error = error.message;
        this.loading = false;
        return of('Retry failed. Server is down').pipe(
          retryWhen(errors => errors.pipe(
            scan((retryCount: number) => {
              this.retryCount = retryCount;
              return retryCount + 1;
            }, 0),
            tap((retryAttempt: number) => {
              this.result = 'Network error. Retrying...';
              if (retryAttempt >= 2) {
                throw new Error('Retries exhausted');
              }
            })
          ))
        );
      }),
      tap({
        next: value => {
          this.loading = false;
          this.result = value;
          if (value !== 'Operation successful!') {
            this.finalMessage = 'Our servers are down. Please try again later.';
          }
        },
        error: error => {
          this.loading = false;
          this.finalMessage = 'Our servers are down. Please try again later.';
        },
        complete: () => console.log('Request complete')
      })
    );

    httpRequest$.subscribe();
  }
}
