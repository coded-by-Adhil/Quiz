<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('quiz_link_id')
                ->constrained('quiz_links')
                ->restrictOnDelete();
            $table->string('participant_name');
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->integer('score')->nullable();
            $table->integer('total_marks');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};
