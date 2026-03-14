export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {

    const res = await fetch(url, {
        ...options,
        credentials: 'include', // always send cookies
    });

    // Access token expired — try to refresh silently
    if (res.status === 401) {
        const refreshRes = await fetch('http://localhost:5000/auth/refresh', {
            method: 'POST',
            credentials: 'include',
        });

        if (!refreshRes.ok) {
            // Refresh token also invalid/expired — force logout
            window.location.href = '/';
            return refreshRes;
        }

        // Retry the original request with the new access token cookie
        return fetch(url, {
            ...options,
            credentials: 'include',
        });
    }

    return res;
}