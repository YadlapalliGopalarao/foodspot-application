<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'user_id',
        'total',
        'status'
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2'
        ];
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
