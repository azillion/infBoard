import { assign, setup } from 'xstate';

interface AppContext {
    nickname: string;
}

type AppEvent =
    | { type: 'SET_NICKNAME'; nickname: string };

const context: AppContext = {
    nickname: localStorage.getItem('nickname') || ''
};

const initial = context.nickname ? 'drawing' : 'nickname';

const appMachine = setup({
    types: {} as {
        context: AppContext;
        event: AppEvent;
    },
    actions: {
        setNickname: assign({
            // @ts-ignore - unused variable is on purpose
            nickname: ({ _, event }) => event.nickname
        }),
        submitNickname: ({ context: { nickname } }) => {
            localStorage.setItem('nickname', nickname);
        }
    },
    guards: {
        "isValidNickname?": ({ context: { nickname } }) => {
            return nickname.length > 0;
        },
    },
}).createMachine(
    {
        id: 'app',
        initial,
        context,
        types: {} as {
            context: AppContext;
            event: AppEvent;
        },
        states: {
            nickname: {
                on: {
                    SET_NICKNAME: {
                        actions: 'setNickname'
                    },
                    SUBMIT_NICKNAME: {
                        target: 'drawing',
                        guard: {
                            type: 'isValidNickname?'
                        },
                        actions: 'submitNickname'
                    }
                }
            },
            drawing: {
            }
        }
    },
);

export default appMachine;
