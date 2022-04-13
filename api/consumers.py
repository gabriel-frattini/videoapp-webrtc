import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio


class VideoConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.room_group_name = 'Test-Room'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        print('Disconnected!')

    # Receive message from WebSocket

    async def receive(self, text_data):
        receive_dict = json.loads(text_data)
        peer_username = receive_dict['peer']
        action = receive_dict['action']
        message = receive_dict['message']

        # print('unanswered_offers: ', self.unanswered_offers)

        print('Message received: ', message)

        print('peer_username: ', peer_username)
        print('action: ', action)

        if(action == 'new-offer') or (action == 'new-answer'):
            # in case its a new offer or answer
            # send it to the new peer or initial offerer respectively

            receiver_channel_name = receive_dict['message']['receiver_channel_name']

            print('dictionary: ', receive_dict)
            print('Sending to Second Channel Name: ', receiver_channel_name)

            # set new receiver as the current sender
            receive_dict['message']['receiver_channel_name'] = self.channel_name

            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send.sdp',
                    'receive_dict': receive_dict,
                }
            )

            return

        # set new receiver as the current sender
        # so that some messages can be sent
        # to this channel specifically
        receive_dict['message']['receiver_channel_name'] = self.channel_name
        print('First Channel name: ', self.channel_name)

        # send to all peers
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send.sdp',
                'receive_dict': receive_dict,
            }
        )

    async def send_sdp(self, event):
        receive_dict = event['receive_dict']

        this_peer = receive_dict['peer']
        action = receive_dict['action']
        message = receive_dict['message']

        await self.send(text_data=json.dumps({
            'peer': this_peer,
            'action': action,
            'message': message,
        }))

# from cgitb import text
# from channels.generic.websocket import AsyncWebsocketConsumer
# import json


# class VideoConsumer(AsyncWebsocketConsumer):

#     async def connect(self):

#         self.room_group_name = 'Test-Room'

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )

#         await self.accept()

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )

#     async def disconnet(self, *args, **kwargs):

#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )

#         print('Disconnected..')

#     async def receive(self, text_data):
#         receive_dict = json.loads(text_data)
#         message = receive_dict["message"]
#         action = receive_dict["action"]

#         print('action: ',action)

#         if action=="new-offer" or action=="new-answer":
#             receiver_channel_name = receive_dict["message"]["receiver_channel_name"]

#             print("channel_name is: ",self.channel_name)
#             receive_dict["message"]["receiver_channel_name"] = self.channel_name

#             await self.channel_layer.send(
#             receiver_channel_name,
#              {
#                 'type': 'send_sdp',
#                 'receive_dict': receive_dict
#             })

#         receive_dict["message"]["receiver_channel_name"] = self.channel_name
#         print(self)

#     async def send_sdp(self, event):
#       recevie_dict = event["receive_dict"]

#       await self.send(text_data=json.dumps({
#         recevie_dict
#        }))
