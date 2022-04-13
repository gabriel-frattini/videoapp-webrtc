"""
ASGI config for proj project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/asgi/
"""


import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import api.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proj.settings')
django.setup()
application = ProtocolTypeRouter({
  "https": get_asgi_application(),
  "websocket": AuthMiddlewareStack(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})



# import os

# from channels.routing import ProtocolTypeRouter, URLRouter
# from django.core.asgi import get_asgi_application
# from channels.auth import AuthMiddlewareStack
# from api import routing

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proj.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     'websocket': AuthMiddlewareStack(
#         URLRouter(
#             routing.websocket_urlpatterns,
#         )
#     )
# })
