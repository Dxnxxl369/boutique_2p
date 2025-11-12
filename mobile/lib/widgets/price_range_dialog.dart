import 'package:flutter/material.dart';

class PriceRangeDialog extends StatefulWidget {
  final double? minPrice;
  final double? maxPrice;

  const PriceRangeDialog({super.key, this.minPrice, this.maxPrice});

  @override
  State<PriceRangeDialog> createState() => _PriceRangeDialogState();
}

class _PriceRangeDialogState extends State<PriceRangeDialog> {
  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.minPrice != null) {
      _minPriceController.text = widget.minPrice!.toString();
    }
    if (widget.maxPrice != null) {
      _maxPriceController.text = widget.maxPrice!.toString();
    }
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Establecer Rango de Precios'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _minPriceController,
            keyboardType: TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Precio Mínimo',
              prefixIcon: Icon(Icons.attach_money),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _maxPriceController,
            keyboardType: TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Precio Máximo',
              prefixIcon: Icon(Icons.attach_money),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop(); // Dismiss dialog
          },
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            final double? min = double.tryParse(_minPriceController.text);
            final double? max = double.tryParse(_maxPriceController.text);

            if (min != null && max != null && min > max) {
              // Optionally show an error message
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('El precio mínimo no puede ser mayor que el máximo.')),
              );
              return;
            }

            Navigator.of(context).pop({'min': min, 'max': max});
          },
          child: const Text('Aplicar'),
        ),
      ],
    );
  }
}