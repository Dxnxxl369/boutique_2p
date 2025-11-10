from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'

class IsVendedorUser(permissions.BasePermission):
    """
    Allows access only to vendedor users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'vendedor'

class IsAdminOrVendedor(permissions.BasePermission):
    """
    Allows access only to admin or vendedor users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.role == 'vendedor')

class IsCustomerUser(permissions.BasePermission):
    """
    Allows access only to customer users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'user'

class IsStaffMember(permissions.BasePermission):
    """
    Allows access only to staff members (admin, vendedor, bodeguero, cajero).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff_member

class IsOwnerOrAdminOrVendedor(permissions.BasePermission):
    """
    Custom permission to only allow owners, admin, or vendedor of an object to access it.
    Assumes the object instance has a `created_by` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request, so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the snippet.
        return obj.created_by == request.user or request.user.role in ['admin', 'vendedor']
