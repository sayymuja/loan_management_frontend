
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiChatRequest {
  question: string;
}

export interface AiChatResponse {
  answer: string;
  cmrcName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private readonly apiUrl = 'http://localhost:8080/api/ai/chat';

  constructor(private http: HttpClient) {}

  chat(question: string): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(
      this.apiUrl,
      { question } as AiChatRequest
    );
  }
}
