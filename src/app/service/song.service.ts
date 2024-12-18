import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { SaveSong } from './model/song.model';
import { State } from './model/state.model';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SongService {

  http = inject(HttpClient);
  authService = inject(AuthService);

  private add$: WritableSignal<State<SaveSong, HttpErrorResponse>> = signal(State.Builder<SaveSong, HttpErrorResponse>().forInit().build());
  addSig = computed(() => this.add$());

  add(song: SaveSong): void {
    const formData = new FormData();
    formData.append('cover', song.cover!);
    formData.append('file', song.file!);

    const clone = structuredClone(song); 
    clone.file = undefined;
    clone.cover = undefined;
    formData.append('dto', JSON.stringify(clone));

    const headers = this.authService.getCsrfHeaders();

    this.http.post<SaveSong>(`${environment.API_URL}/api/songs`, formData, { headers, withCredentials: true })
      .subscribe({
        next: (savedSong) => {
          this.add$.set(State.Builder<SaveSong, HttpErrorResponse>().forSuccess(savedSong).build());
        },
        error: (error: HttpErrorResponse) => {
          this.add$.set(State.Builder<SaveSong, HttpErrorResponse>().forError(error).build());
        },
    });
  }

  reset(): void {
    this.add$.set(State.Builder<SaveSong, HttpErrorResponse>().forInit().build());
  }

  constructor() { }
}
