import { assign, setup } from 'xstate';

export interface AppContext {
    nickname: string;
}

export type AppEvent =
    | { type: 'SET_NICKNAME'; nickname: string }
    | { type: 'SUBMIT_NICKNAME' }
    | { type: 'CONNECTION_ESTABLISHED' };

const context: AppContext = {
    nickname: ''
};

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
        initial: 'loading',
        context,
        types: {} as {
            context: AppContext;
            event: AppEvent;
        },
        states: {
            loading: {
                on: {
                    CONNECTION_ESTABLISHED: {
                        target: 'nickname'
                    }
                }
            },
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
            drawing: {}
        }
    },
);

export default appMachine;

