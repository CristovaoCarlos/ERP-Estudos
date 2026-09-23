<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** E-mail com o link para redefinir a senha, no endereço da prefeitura em que foi pedido. */
class RedefinirSenha extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $url,
        private string $prefeitura,
        private int $minutos,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Redefinir a senha do STM — {$this->prefeitura}")
            ->greeting("Olá, {$notifiable->name}!")
            ->line("Recebemos um pedido para redefinir a sua senha do STM em {$this->prefeitura}.")
            ->action('Redefinir senha', $this->url)
            ->line("O link vale por {$this->minutos} minutos e só pode ser usado uma vez.")
            ->line('Se não foi você quem pediu, ignore este e-mail: sua senha continua a mesma.')
            ->salutation('Atenciosamente, STM — Sistema de Tributação Municipal');
    }
}
