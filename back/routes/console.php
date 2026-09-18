<?php

use App\Models\Registrations\Admin\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\Console\Question\Question;
use App\Services\Releases\Grain\TechnicalLossService;
use Illuminate\Support\Facades\Schedule;

Artisan::command('app:create-user {email}', function (string $email) {
    $question = new Question('Password: ');
    $question->setHidden(true);
    $question->setHiddenFallback(false);
    $password = $this->output->askQuestion($question);

    $user = User::updateOrCreate(
        ['email' => $email],
        ['name' => Str::before($email, '@'), 'password' => Hash::make($password), 'email_verified_at' => now()]
    );

    $this->info("User {$user->email} created/updated successfully.");
})->purpose('Create or update an API user');

Artisan::command('grain:apply-technical-loss', function (TechnicalLossService $service): void {
    $processed = $service->processDue();
    $this->info("Quebras técnicas processadas: {$processed}");
})->purpose('Aplica a quebra técnica proporcional do mês anterior');

Schedule::command('grain:apply-technical-loss')->monthlyOn(1, '00:10')->withoutOverlapping();
