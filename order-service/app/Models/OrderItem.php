<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $table = 'order_items';

    protected $fillable = [
        'food_id',
        'name',
        'price',
        'quantity'
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'quantity' => 'integer'
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
