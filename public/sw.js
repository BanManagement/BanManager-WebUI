self.addEventListener('push', function (event) {
  const data = event.data.json()

  return event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    data: data.data,
    tag: `bm-web-notification-${data.data.notificationId}`,
    icon: `https://crafatar.com/avatars/${data.data.actorId}?size=${256}&overlay=true`
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(`/api/notifications/${event.notification.data.notificationId}`))
})

// Listen to  `pushsubscriptionchange` event which is fired when
// subscription expires. Subscribe again and register the new subscription
// in the server by sending a POST request with endpoint. Real world
// application would probably use also user identification.
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(function (subscription) {
        return fetch('/api/notifications/subscribe', {
          method: 'post',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({ subscription })
        })
      })
  )
})
