const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }) //location.search provides the query string provided in any url (ie. after ?)

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated! ', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')
// })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled (how far a user has scrolled from the topmost message)
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight // auto scroll if at bottom
    }
}

socket.on('message', (message) => {
    console.log(message)
    //rendering the message templates
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        //formating the time stamp with the help of moment(library) : momentjs.com
        createdAt: moment (message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    //rendering location template
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()  //to prevent the default behaviour of browser to refresh the full page

    $messageFormButton.setAttribute('disabled', 'disabled') //disable send button while the message is been sent

    //const message = document.querySelector('input').value //storing the input provided by user through input box
    const message = e.target.elements.message.value //getting input by the name so that if there is another input present then the code would not break
    
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled') //enable the button once the message is delivered
        $messageFormInput.value = ' ' //clearing typed message after its delivered
        $messageFormInput.focus()
        

        if(error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }
    //disable
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position)
        // const latitude = position.coords.latitude
        // const longitude = position.coords.longitude
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            //enable
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })

        
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})