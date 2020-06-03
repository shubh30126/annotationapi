const fetchCall = params => {
    switch (params.method) {
        case "GET":
        case "DELETE":
            return new Promise((resolve, reject) => {
                fetch(params.url, {
                    method: params.method,
                })
                    .then(response => {
                        if (response.ok) {
                            response.json().then(res => resolve(res));
                        } else {
                            reject(response);
                        }
                    });
            });
        case "POST":
        case "PATCH":
        case "PUT":
            return new Promise((resolve, reject) => {
                fetch(params.url, {
                    method: params.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params.body)
                })
                    .then(response => {
                        if (response.ok) {
                            response.json().then(res => resolve(res));
                        } else {
                            reject(response);
                        }
                    });
            });
        default:
            return Promise.reject(new Error("Invalid Method"));
    }
};

export default fetchCall;
