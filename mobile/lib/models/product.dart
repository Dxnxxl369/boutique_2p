class Product {
  const Product({
    required this.id,
    required this.name,
    this.description,
    this.sku,
    required this.price,
    this.cost,
    this.category,
    this.categoryName,
    required this.stock,
    this.size,
    this.color,
    this.brand,
    this.image,
    this.status,
    this.createdAt,
    this.updatedAt,
  });

  final int id;
  final String name;
  final String? description;
  final String? sku;
  final double price;
  final double? cost;
  final int? category;
  final String? categoryName;
  final int stock;
  final String? size;
  final String? color;
  final String? brand;
  final String? image;
  final String? status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      sku: json['sku'] as String?,
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      cost: json['cost'] != null
          ? double.tryParse(json['cost'].toString())
          : null,
      category: json['category'] as int?,
      categoryName: json['category_name'] as String?,
      stock: json['stock'] as int,
      size: json['size'] as String?,
      color: json['color'] as String?,
      brand: json['brand'] as String?,
      image: json['image'] as String?,
      status: json['status'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'sku': sku,
      'price': price,
      'cost': cost,
      'category': category,
      'category_name': categoryName,
      'stock': stock,
      'size': size,
      'color': color,
      'brand': brand,
      'image': image,
      'status': status,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
