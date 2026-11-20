<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('order_id');
            $table->string('event');
            $table->string('message');
            $table->timestamps();

            $table->unique(['order_id', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
