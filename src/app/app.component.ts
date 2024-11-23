import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {environment} from "../environments/environment";
import {FormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgForOf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  @ViewChild('textbox') textbox!: ElementRef;

  protected gptModels: string[] = [
    'gpt-4o-mini',
  ];

  protected gptModel: string = '';

  private textHistory = "";

  ngOnInit(): void {
    this.gptModel = this.gptModels[0];
  }

  protected onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  protected sendMessage() {

    let textToSend = this.textbox.nativeElement.value;

    this.textHistory += `userSays: ${textToSend}\n`;

    const body = {
      "model": `${this.gptModel}`,
      "messages": [
        {
          "role": "system",
          "content": "You are a helpful assistant. You must answer in Spanish from Spain."
        },
        {
          "role": "user",
          "content": `${this.textHistory}`
        }
      ]
    };

    // Aquí se muestra en el chat el mensaje enviado por el usuario
    this.showNewMessage(textToSend, true);

    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${environment.apiKey}`
      },
      body: JSON.stringify(body)
    }).then((resp) => {
      if (!resp.ok) {
        throw new Error('ERROR');
      }

      return resp.json();
    }).then((data) => {
      const receivedMessage = data['choices'][0]['message']['content'];
      this.textHistory += `gptSays: ${receivedMessage}\n`;
      this.showNewMessage(receivedMessage, false);
    });

    this.textbox.nativeElement.value = "";
  }

  showNewMessage(message: string, sent: boolean) {
  let chat = document.getElementById('chat-conversation');
  let chatParent = document.createElement("div");
  let chatMsg = document.createElement("p");

  message = this.markdownToHtml(message).replace("gptSays:", "");

  if (sent) {
    chatMsg.classList.add('chat-message', 'chat-message-sent');
  } else {
    chatMsg.classList.add('chat-message', 'chat-message-received');
  }

  chatMsg.innerHTML = message;

  chatParent.style.width = '100%';

  chatParent.appendChild(chatMsg);

  if (chat) {
    chat.appendChild(chatParent);
    chat.scrollTo(0, chat.scrollHeight);
  }

}

  markdownToHtml(markdown: string) {
    let html = markdown;

    // Función para escapar caracteres especiales en HTML
    function escapeHTML(str: string) {
      return str.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
    }

    // Código en bloque
    html = html.replace(/```([\s\S]*?)```/g, function (match, p1) {
      const lang = p1.split('\n')[0];
      return '<div class="code-title">' + lang +
          '</div><pre><code>' + escapeHTML(p1).split('\n').slice(1).join('\n') + '</code></pre>';
    });

    // Código en línea
    html = html.replace(/`([^`]+)`/g, function (match, p1) {
      return '<code class="code-inline">' + escapeHTML(p1) + '</code>';
    });

    // Encabezados (h1 a h6)
    html = html.replace(/^###### (.*)$/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gim, '<h1>$1</h1>');

    // Negritas
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

    // Cursivas
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

    // Enlaces
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Imágenes
    html = html.replace(/\!\[([^\]]+)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />');

    // Citas
    html = html.replace(/^\> (.*)$/gim, '<blockquote>$1</blockquote>');

    // Listas sin orden
    html = html.replace(/^\s*[\*\-\+] (.*)$/gim, '<ul><li>$1</li></ul>');

    // Listas ordenadas
    html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<ol><li>$1</li></ol>');

    // Saltos de línea
    html = html.replace(/\n+/g, '<br>');

    return html.trim();
  }

}
