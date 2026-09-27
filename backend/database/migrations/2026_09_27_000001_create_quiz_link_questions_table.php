<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_link_questions', function (Blueprint $table) {
            $table->foreignId('quiz_link_id')
                ->constrained('quiz_links')
                ->cascadeOnDelete();
            $table->foreignId('question_id')
                ->constrained('questions')
                ->restrictOnDelete();
            $table->integer('order');

            $table->unique(['quiz_link_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_link_questions');
    }
};
