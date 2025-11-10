from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from products.models import Product, Category, InventoryMovement
from orders.models import Order, OrderItem
from decimal import Decimal

User = get_user_model()

class PermissionsTest(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            username='admin', email='admin@example.com', password='password123', role='admin'
        )
        self.vendedor_user1 = User.objects.create_user(
            username='vendedor1', email='vendedor1@example.com', password='password123', role='vendedor'
        )
        self.vendedor_user2 = User.objects.create_user(
            username='vendedor2', email='vendedor2@example.com', password='password123', role='vendedor'
        )
        self.vendedor_user3 = User.objects.create_user(
            username='vendedor3', email='vendedor3@example.com', password='password123', role='vendedor'
        )
        self.customer_user = User.objects.create_user(
            username='test_customer_user', email='customer@example.com', password='password123', role='user'
        )

        # Get groups
        admin_group = Group.objects.get(name='admin')
        vendedor_group = Group.objects.get(name='vendedor')
        user_group = Group.objects.get(name='user')

        # Add users to groups
        self.admin_user.groups.add(admin_group)
        self.vendedor_user1.groups.add(vendedor_group)
        self.vendedor_user2.groups.add(vendedor_group)
        self.vendedor_user3.groups.add(vendedor_group)
        self.customer_user.groups.add(user_group)

        # Create sample data
        self.category = Category.objects.create(name='Test Category', status='active')
        self.product = Product.objects.create(
            name='Test Product', sku='TP001', price=Decimal('100.00'), stock=10, category=self.category
        )
        self.order = Order.objects.create(
            number='ORD001', customer_name='Test Customer', total_amount=Decimal('100.00'),
            status='pending', created_by=self.customer_user
        )
        OrderItem.objects.create(
            order=self.order, product=self.product, quantity=1, unit_price=Decimal('100.00'),
            total_price=Decimal('100.00')
        )
        self.inventory_movement = InventoryMovement.objects.create(
            product=self.product, quantity=5, movement_type='in', reason='initial_stock',
            created_by=self.admin_user, stock_before=self.product.stock, stock_after=self.product.stock + 5
        )

        # URLs for API endpoints
        self.category_list_url = reverse('category-list')
        self.category_detail_url = reverse('category-detail', args=[self.category.pk])
        self.product_list_url = reverse('product-list')
        self.product_detail_url = reverse('product-detail', args=[self.product.pk])
        self.product_sales_report_url = '/api/products/sales-report/'
        self.order_list_url = reverse('order-list')
        self.order_detail_url = reverse('order-detail', args=[self.order.pk])
        self.inventory_movement_list_url = reverse('inventorymovement-list')
        self.inventory_movement_detail_url = reverse('inventorymovement-detail', args=[self.inventory_movement.pk])
        self.user_list_url = reverse('user-list')
        self.user_detail_url = reverse('user-detail', args=[self.customer_user.pk])
        self.admin_user_detail_url = reverse('user-detail', args=[self.admin_user.pk])
        self.vendedor_user_detail_url = reverse('user-detail', args=[self.vendedor_user1.pk])
        print(f"setUp: customer_user.pk = {self.customer_user.pk}")
        print(f"setUp: user_detail_url = {self.user_detail_url}")
        self.user_change_password_url = reverse('user-change-password', args=[self.customer_user.pk])
        self.user_toggle_active_url = reverse('user-toggle-active', args=[self.customer_user.pk])

    def _test_access(self, user, url, method, expected_status, data=None):
        self.client.force_authenticate(user=user)
        if data:
            response = method(url, data=data, format='json')
        else:
            response = method(url)
        print(f"_test_access: Response for {user.username} on {url}: {response}")
        self.assertEqual(response.status_code, expected_status, f"User {user.username} ({user.role}) failed {method.__name__} on {url}. Expected {expected_status}, got {response.status_code}. Response: {response.data}")
        self.client.logout()
        return response

    # --- Category ViewSet Tests ---
    def test_category_permissions(self):
        # Admin: Full CRUD
        self._test_access(self.admin_user, self.category_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.admin_user, self.category_list_url, self.client.post, status.HTTP_201_CREATED, data={'name': 'New Cat', 'status': 'active'})
        self._test_access(self.admin_user, self.category_detail_url, self.client.put, status.HTTP_200_OK, data={'name': 'Updated Cat', 'status': 'active'})
        self._test_access(self.admin_user, self.category_detail_url, self.client.delete, status.HTTP_204_NO_CONTENT)

        # Vendedor: Read-only
        self._test_access(self.vendedor_user1, self.category_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.vendedor_user1, self.category_list_url, self.client.post, status.HTTP_403_FORBIDDEN)
        self._test_access(self.vendedor_user1, self.category_detail_url, self.client.put, status.HTTP_403_FORBIDDEN)
        self._test_access(self.vendedor_user1, self.category_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Customer: Read-only
        self._test_access(self.customer_user, self.category_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.customer_user, self.category_list_url, self.client.post, status.HTTP_403_FORBIDDEN)
        self._test_access(self.customer_user, self.category_detail_url, self.client.put, status.HTTP_403_FORBIDDEN)
        self._test_access(self.customer_user, self.category_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Unauthenticated: Read-only
        self.client.logout()
        response = self.client.get(self.category_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.category_list_url, data={'name': 'Anon Cat', 'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Product ViewSet Tests ---
    def test_product_permissions(self):
        # Admin: Full CRUD
        self._test_access(self.admin_user, self.product_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.admin_user, self.product_list_url, self.client.post, status.HTTP_201_CREATED, data={'name': 'New Prod', 'sku': 'NP001', 'price': '10.00', 'stock': 5, 'category': self.category.pk})
        self._test_access(self.admin_user, self.product_detail_url, self.client.put, status.HTTP_200_OK, data={'name': 'Updated Prod', 'sku': 'TP001', 'price': '12.00', 'stock': 5, 'category': self.category.pk})
        
        # To allow product deletion, first delete related order items and order
        OrderItem.objects.filter(product=self.product).delete()
        Order.objects.filter(pk=self.order.pk).delete()
        self._test_access(self.admin_user, self.product_detail_url, self.client.delete, status.HTTP_204_NO_CONTENT)

        # Vendedor: Read-only
        self._test_access(self.vendedor_user1, self.product_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.vendedor_user1, self.product_list_url, self.client.post, status.HTTP_403_FORBIDDEN, data={'name': 'Vendedor Prod', 'sku': 'VP001', 'price': '10.00', 'stock': 1, 'category': self.category.pk})
        self._test_access(self.vendedor_user1, self.product_detail_url, self.client.put, status.HTTP_403_FORBIDDEN)
        self._test_access(self.vendedor_user1, self.product_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Customer: Read-only
        self._test_access(self.customer_user, self.product_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.customer_user, self.product_list_url, self.client.post, status.HTTP_403_FORBIDDEN)
        self._test_access(self.customer_user, self.product_detail_url, self.client.put, status.HTTP_403_FORBIDDEN)
        self._test_access(self.customer_user, self.product_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Unauthenticated: Read-only
        self.client.logout()
        response = self.client.get(self.product_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.product_list_url, data={'name': 'Anon Prod', 'sku': 'AP001', 'price': '1.00', 'stock': 1, 'category': self.category.pk})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_product_sales_report_permissions(self):
        # Admin and Vendedor: Access
        self._test_access(self.admin_user, self.product_sales_report_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.vendedor_user1, self.product_sales_report_url, self.client.get, status.HTTP_200_OK)

        # Customer: No access
        print(f"test_product_sales_report_permissions: customer_user role = {self.customer_user.role}")
        self._test_access(self.customer_user, self.product_sales_report_url, self.client.get, status.HTTP_403_FORBIDDEN)

        # Unauthenticated: No access
        self.client.logout()
        response = self.client.get(self.product_sales_report_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Order ViewSet Tests ---
    def test_order_permissions(self):
        # Admin and Vendedor: Full CRUD
        order_data = {
            'number': 'ORD002', 'customer_name': 'New Cust', 'total_amount': '50.00',
            'status': 'pending', 'payment_method': 'cash',
            'items': [
                {'product': self.product.pk, 'quantity': 1, 'unit_price': '50.00', 'total_price': '50.00'}
            ]
        }
        # Admin
        self._test_access(self.admin_user, self.order_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.admin_user, self.order_list_url, self.client.post, status.HTTP_201_CREATED, data=order_data)
        self._test_access(self.admin_user, self.order_detail_url, self.client.patch, status.HTTP_200_OK, data={'status': 'completed', 'created_by': self.customer_user.pk})
        self._test_access(self.admin_user, self.order_detail_url, self.client.delete, status.HTTP_204_NO_CONTENT)

        # Vendedor
        self._test_access(self.vendedor_user1, self.order_list_url, self.client.get, status.HTTP_200_OK)
        vendedor_order_data = {
            'number': 'ORD003', 'customer_name': 'Vendedor Cust', 'total_amount': '75.00',
            'status': 'pending', 'payment_method': 'card',
            'items': [
                {'product': self.product.pk, 'quantity': 1, 'unit_price': '75.00', 'total_price': '75.00'}
            ]
        }
        response = self._test_access(self.vendedor_user1, self.order_list_url, self.client.post, status.HTTP_201_CREATED, data=vendedor_order_data)
        vendedor_order_pk = response.json()['id']
        vendedor_order_detail_url = reverse('order-detail', args=[vendedor_order_pk])

        self._test_access(self.vendedor_user1, vendedor_order_detail_url, self.client.patch, status.HTTP_200_OK, data={'status': 'completed'})
        # Vendedor should not be able to delete orders (backend permission allows, but policy might restrict)
        # For now, based on IsAdminOrVendedor, they can. If policy changes, this test needs update.
        self._test_access(self.vendedor_user1, vendedor_order_detail_url, self.client.delete, status.HTTP_204_NO_CONTENT)


        # Customer: No access to general order list or other orders
        self._test_access(self.customer_user, self.order_list_url, self.client.get, status.HTTP_200_OK) # Customer can see their own orders
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.order_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Should only see their own order
        self.client.logout()

        self._test_access(self.customer_user, self.order_list_url, self.client.post, status.HTTP_403_FORBIDDEN, data=order_data)
        self._test_access(self.customer_user, self.order_detail_url, self.client.put, status.HTTP_403_FORBIDDEN, data={'status': 'completed'})
        self._test_access(self.customer_user, self.order_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Unauthenticated: No access
        self.client.logout()
        response = self.client.get(self.order_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- InventoryMovement ViewSet Tests ---
    def test_inventory_movement_permissions(self):
        movement_data = {
            'product': self.product.pk, 'quantity': 2, 'movement_type': 'salida', 'reason': 'venta'
        }
        # Admin: Full CRUD
        self._test_access(self.admin_user, self.inventory_movement_list_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.admin_user, self.inventory_movement_list_url, self.client.post, status.HTTP_201_CREATED, data=movement_data)
        self._test_access(self.admin_user, self.inventory_movement_detail_url, self.client.put, status.HTTP_200_OK, data={'product': self.product.pk, 'quantity': 3, 'movement_type': 'entrada', 'reason': 'devolucion'})
        self._test_access(self.admin_user, self.inventory_movement_detail_url, self.client.delete, status.HTTP_204_NO_CONTENT)

        # Vendedor: No access
        self._test_access(self.vendedor_user1, self.inventory_movement_list_url, self.client.get, status.HTTP_403_FORBIDDEN)
        self._test_access(self.vendedor_user1, self.inventory_movement_list_url, self.client.post, status.HTTP_403_FORBIDDEN, data=movement_data)
        self._test_access(self.vendedor_user1, self.inventory_movement_detail_url, self.client.put, status.HTTP_403_FORBIDDEN, data=movement_data)
        self._test_access(self.vendedor_user1, self.inventory_movement_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Customer: No access
        self._test_access(self.customer_user, self.inventory_movement_list_url, self.client.get, status.HTTP_403_FORBIDDEN)
        self._test_access(self.customer_user, self.inventory_movement_list_url, self.client.post, status.HTTP_403_FORBIDDEN, data=movement_data)
        self._test_access(self.customer_user, self.inventory_movement_detail_url, self.client.put, status.HTTP_403_FORBIDDEN, data=movement_data)
        self._test_access(self.customer_user, self.inventory_movement_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

        # Unauthenticated: No access
        self.client.logout()
        response = self.client.get(self.inventory_movement_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- User ViewSet Tests ---
    def test_user_list_permissions(self):
        # Admin: Can list all users
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 5) # Admin, 3 Vendedores, Customer
        self.client.logout()

        # Vendedor: Can list only customer users
        self.client.force_authenticate(user=self.vendedor_user1)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Should only see customer_user
        self.assertEqual(response.data[0]['username'], self.customer_user.username)
        self.client.logout()

        # Customer: Can list only their own user (via get_queryset filter)
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Should only see self
        self.assertEqual(response.data[0]['username'], self.customer_user.username)
        self.client.logout()

        # Unauthenticated: No access
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_detail_permissions(self):
        # Admin: Can access any user's detail
        self._test_access(self.admin_user, self.user_detail_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.admin_user, self.vendedor_user_detail_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.admin_user, self.admin_user_detail_url, self.client.get, status.HTTP_200_OK)

        # Vendedor: Can access customer user detail, but not other staff or admin
        self._test_access(self.vendedor_user1, self.user_detail_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.vendedor_user1, self.admin_user_detail_url, self.client.get, status.HTTP_404_NOT_FOUND) # Vendedor cannot see admin user
        self._test_access(self.vendedor_user1, self.vendedor_user_detail_url, self.client.get, status.HTTP_404_NOT_FOUND) # Vendedor cannot see other vendedores

        # Customer: Can access only their own detail
        self._test_access(self.customer_user, self.user_detail_url, self.client.get, status.HTTP_200_OK)
        self._test_access(self.customer_user, self.admin_user_detail_url, self.client.get, status.HTTP_404_NOT_FOUND) # Customer cannot see admin user
        self._test_access(self.customer_user, self.vendedor_user_detail_url, self.client.get, status.HTTP_404_NOT_FOUND) # Customer cannot see vendedor user

    def test_user_create_permissions(self):
        new_user_data = {'username': 'newuser_by_admin', 'email': 'new@example.com', 'password': 'password123', 'role': 'user'}
        new_admin_data = {'username': 'newadmin_by_admin', 'email': 'newadmin@example.com', 'password': 'password123', 'role': 'admin'}
        vendedor_attempt_data = {'username': 'vendedor_attempt', 'email': 'vendedor@example.com', 'password': 'password123', 'role': 'user'}

        # Admin: Can create any user
        self._test_access(self.admin_user, self.user_list_url, self.client.post, status.HTTP_201_CREATED, data=new_user_data)
        self._test_access(self.admin_user, self.user_list_url, self.client.post, status.HTTP_201_CREATED, data=new_admin_data)

        # Vendedor: Cannot create users
        self._test_access(self.vendedor_user1, self.user_list_url, self.client.post, status.HTTP_403_FORBIDDEN, data=vendedor_attempt_data)

        # Customer: Cannot create users
        self._test_access(self.customer_user, self.user_list_url, self.client.post, status.HTTP_403_FORBIDDEN, data={'username': 'customer_attempt', 'email': 'customer_attempt@example.com', 'password': 'password123', 'role': 'user'})

    def test_user_update_permissions(self):
        update_data = {'first_name': 'Updated'}
        update_role_data = {'role': 'admin'}

        # Admin: Can update any user, including role
        self._test_access(self.admin_user, self.user_detail_url, self.client.patch, status.HTTP_200_OK, data=update_data)
        self._test_access(self.admin_user, self.user_detail_url, self.client.patch, status.HTTP_200_OK, data=update_role_data)

        # Vendedor: Cannot update any user
        # Retrieve the customer user by username to ensure consistency
        customer_user_for_vendedor = User.objects.get(username='test_customer_user')
        user_detail_url_for_vendedor = reverse('user-detail', args=[customer_user_for_vendedor.pk])
        self._test_access(self.vendedor_user1, user_detail_url_for_vendedor, self.client.patch, status.HTTP_403_FORBIDDEN, data=update_data) # Vendedor can see customer, but cannot update
        self._test_access(self.vendedor_user1, self.vendedor_user_detail_url, self.client.patch, status.HTTP_404_NOT_FOUND, data=update_data) # Vendedor cannot see other vendedores

        # Customer: Can update their own profile, but not role
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.patch(self.user_detail_url, data=update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.patch(self.user_detail_url, data=update_role_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Cannot change role
        self.client.logout()

    def test_user_delete_permissions(self):
        # Admin: Can delete any user
        # Retrieve the customer user by username to ensure consistency
        customer_user_to_delete = User.objects.get(username='test_customer_user')
        user_detail_url_to_delete = reverse('user-detail', args=[customer_user_to_delete.pk])
        self._test_access(self.admin_user, user_detail_url_to_delete, self.client.delete, status.HTTP_204_NO_CONTENT)
        # Recreate customer user for other tests if needed
        self.customer_user = User.objects.create_user(username='test_customer_user', email='customer@example.com', password='password123', role='user')

        # Vendedor: Cannot delete users
        self._test_access(self.vendedor_user1, self.vendedor_user_detail_url, self.client.delete, status.HTTP_404_NOT_FOUND) # Vendedor cannot see other vendedores
        # Retrieve the customer user by username to ensure consistency
        customer_user_for_vendedor = User.objects.get(username='test_customer_user')
        user_detail_url_for_vendedor = reverse('user-detail', args=[customer_user_for_vendedor.pk])
        self._test_access(self.vendedor_user1, user_detail_url_for_vendedor, self.client.delete, status.HTTP_403_FORBIDDEN) # Vendedor can see customer, but cannot delete

        # Customer: Cannot delete users
        self._test_access(self.customer_user, self.user_detail_url, self.client.delete, status.HTTP_403_FORBIDDEN)

    def test_user_change_password_permissions(self):
        # Admin: Can change any user's password
        self._test_access(self.admin_user, self.user_change_password_url, self.client.post, status.HTTP_200_OK, data={'new_password': 'newpassword'})

        # Vendedor: Cannot change any user's password
        self._test_access(self.vendedor_user1, self.user_change_password_url, self.client.post, status.HTTP_403_FORBIDDEN, data={'new_password': 'newpassword'})

        # Customer: Can change their own password
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.post(self.user_change_password_url, data={'new_password': 'newpassword'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.logout()

    def test_user_toggle_active_permissions(self):
        # Admin: Can toggle any user's active status
        self._test_access(self.admin_user, self.user_toggle_active_url, self.client.post, status.HTTP_200_OK)

        # Vendedor: Cannot toggle active status
        self._test_access(self.vendedor_user1, self.user_toggle_active_url, self.client.post, status.HTTP_403_FORBIDDEN)

        # Customer: Cannot toggle active status
        self._test_access(self.customer_user, self.user_toggle_active_url, self.client.post, status.HTTP_403_FORBIDDEN)
