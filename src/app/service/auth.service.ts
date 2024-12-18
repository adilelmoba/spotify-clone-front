import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpStatusCode,
  HttpXsrfTokenExtractor,
} from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { State } from './model/state.model';
import { User } from './model/user.model';
import { environment } from '../../environments/environment.development';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  http = inject(HttpClient);
  location = inject(Location);
  xsrfTokenExtractor = inject(HttpXsrfTokenExtractor);

  notConnected = 'NOT_CONNECTED';

  private fetchUser$: WritableSignal<State<User, HttpErrorResponse>> = signal(
    State.Builder<User, HttpErrorResponse>()
      .forSuccess({ email: this.notConnected })
      .build()
  );
  fetchUser = computed(() => this.fetchUser$());

  fetch(): void {
    this.http
      .get<User>(`${environment.API_URL}/api/get-authenticated-user`)
      .subscribe({
        next: (user) => {
          this.fetchUser$.set(
            State.Builder<User, HttpErrorResponse>().forSuccess(user).build()
          );
          this.fetchCsrfToken();
        },
        error: (error: HttpErrorResponse) => {
          if (
            error.status === HttpStatusCode.Unauthorized &&
            this.isAuthenticated()
          ) {
            this.fetchUser$.set(
              State.Builder<User, HttpErrorResponse>()
                .forSuccess({ email: this.notConnected })
                .build()
            );
          } else {
            this.fetchUser$.set(
              State.Builder<User, HttpErrorResponse>().forError(error).build()
            );
          }
        },
      });
  }

  isAuthenticated(): boolean {
    if (this.fetchUser$().value) {
      return this.fetchUser$().value!.email !== this.notConnected;
    } else {
      return false;
    }
  }

  login(): void {
    location.href = `${location.origin}${this.location.prepareExternalUrl(
      'oauth2/authorization/okta'
    )}`;
  }

  logout(): void {
    const headers = this.getCsrfHeaders();

    this.http
      .post(
        `${environment.API_URL}/api/logout`,
        {},
        { headers, withCredentials: true }
      )
      .subscribe({
        next: (response: any) => {
          this.fetchUser$.set(
            State.Builder<User, HttpErrorResponse>()
              .forSuccess({ email: this.notConnected })
              .build()
          );
          location.href = response.logoutUrl;
        },
        error: (error: HttpErrorResponse) => {
          this.fetchUser$.set(
            State.Builder<User, HttpErrorResponse>().forError(error).build()
          );
        },
      });
  }

  getCsrfHeaders(): HttpHeaders {
    const csrfToken = this.xsrfTokenExtractor.getToken();
    return new HttpHeaders({
      'X-XSRF-TOKEN': csrfToken || ''
    });
  }

  private fetchCsrfToken(): void {
    this.http
      .get<{ headerName: string; parameterName: string; token: string }>(
        `${environment.API_URL}/api/csrf-token`,
        { withCredentials: true }
      )
      .subscribe({
        next: (csrfToken) => {
          // console.log('CSRF Token récupéré :', csrfToken.token);
        },
        error: (error) => console.error('Erreur CSRF Token :', error),
      });
  }

  constructor() {}
}
