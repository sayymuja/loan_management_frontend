
import { Component } from '@angular/core';
import { AiService } from '../services/ai.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent {

  question = '';
  loading = false;
  errorMessage = '';

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: 'Hello! I am your Loan Management AI assistant. How can I help you today?'
    }
  ];

  constructor(private aiService: AiService) {}

  sendMessage(): void {
    const question = this.question.trim();

    if (!question || this.loading) {
      return;
    }

    this.messages.push({
      role: 'user',
      content: question
    });

    this.question = '';
    this.loading = true;
    this.errorMessage = '';

    this.aiService.chat(question).subscribe({
      next: (response) => {
        this.messages.push({
          role: 'assistant',
          content: response.answer
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('AI chat request failed:', error);

        this.errorMessage =
          error.status === 401 || error.status === 403
            ? 'Your session may have expired. Please log in again.'
            : 'Unable to connect to AI. Please check the backend and Ollama.';

        this.loading = false;
      }
    });
  }

  handleEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
