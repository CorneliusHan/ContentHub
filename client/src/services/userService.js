import server from '../config/server';

// TODO: handle failed requests?
async function getCurrentSessionInfo() {
    const url = new URL(`${server}/user/current/session`);

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
    });
    if (!response.ok) {
        console.log(response); // handle 404/500 errors
        return null;
    }

    return response.json();
}

export const userService = {
    getCurrentSessionInfo
}