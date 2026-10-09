<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempt_answer_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempt_answer_id')
                ->constrained('quiz_attempt_answers')
                ->cascadeOnDelete();
            $table->foreignId('question_option_id')
                ->constrained('question_options')
                ->restrictOnDelete();

            $table->unique(
                ['quiz_attempt_answer_id', 'question_option_id'],
                'attempt_answer_option_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_answer_options');
    }
};
