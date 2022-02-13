'use strict';

import * as Vue from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.20/vue.esm-browser.prod.js';

const app = Vue.createApp({
    data: () => ({
        text: '',
        currentWord: 0,
        initialTimer: 600,
        timer: -1,
        timerFn: null,
        textTyped: '',
        typed: '',
        _right: 0,
        _wrong: 0,
        wordsRight: 0,
        wordsWrong: 0,
        modal: null,
        tries: 0,
        state: {
            shiftLeft: false,
            shiftRight: false,
            caps: false,
        },

        config: {
            get theme() {
                return localStorage.getItem('theme') ?? 'system';
            },

            set theme(val) {
                localStorage.setItem('theme', val);
                document.querySelector('html')?.setAttribute('theme', val);
            },
        },
    }),

    mounted() {
        document.querySelector('#wpm_input').focus();
    },

    computed: {
        text_words() {
            if (this.timer === -1) {
                if (this.tries === 0) {
                    return 'Press ENTER to start'.split(' ');
                }
                return 'Press ENTER to restart'.split(' ');
            }

            if (!this.text) {
                return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'.split(' ');
            }

            return this.text.split(' ');
        },

        right() {
            this._right = this.full_typed_text().split(' ').map((word, i) => word.split('').filter((char, j) => j < this.text_words[i].length && this.text_words[i][j] === char).length).reduce((acc, v) => acc + v, 0);
            return this._right;
        },

        wrong() {
            //this._wrong = Math.max(this._wrong, this.full_typed_text().split(' ').map((word, i) => word.split('').filter((char, j) => j >= this.text_words[i].length || this.text_words[i][j] !== char).length).reduce((acc, v) => acc + v, 0));
            return this._wrong;
        },

        accuracy() {
            if (!this.gross_wpm()) {
                return 0;
            }

            return this.net_wpm() / this.gross_wpm() * 100;
        },

        elapsed_time() {
            return this.initialTimer - this.timer;
        },

        speed() {
            if (this.wordsWrong >= 20) {
                return 0;
            }

            if (this.timer < this.initialTimer) {
                return Math.max(0, Math.round(this.net_wpm()));
            }

            return 0;
        },
    },

    methods: {
        async fetch_words() {
            const words = await fetch('https://random-word-api.herokuapp.com/word?number=200').then(res => res.json());
            this.text = words.join(' ');
        },

        async start() {
            this.timer = this.initialTimer;
            this.tries++;
            document.querySelector('#wpm_input').focus();

            await this.fetch_words();
        },

        full_typed_text() {
            return (this.textTyped + (this.typed ? ' ' + this.typed : '')).trimStart();
        },

        gross_wpm() {
            return (this.right + this.wrong) / 5 / this.elapsed_time * 600;
        },

        net_wpm() {
            return this.gross_wpm() - this.wrong / 5 / this.elapsed_time * 600;
        },

        keyup(e) {
            if (e.code === 'ShiftLeft') {
                this.state.shiftLeft = false;
            } else if (e.code === 'ShiftRight') {
                this.state.shiftRight = false;
            }

            const key = document.querySelector(`.key.valid[data-key="${e.code}"]`);
            if (key) {
                key.classList.remove('active');
            }
        },

        keydown(e) {
            if (e.code === 'ShiftLeft') {
                this.state.shiftLeft = true;
            } else if (e.code === 'ShiftRight') {
                this.state.shiftRight = true;
            } else if (e.code === 'CapsLock') {
                this.state.caps = !this.state.caps;
            }

            const key = document.querySelector(`.key.valid[data-key="${e.code}"]`);
            if (key) {
                key.classList.add('active');
            }

            if (this.timer === -1) {
                e.preventDefault();
                if (e.keyCode === 13) {
                    this.start();
                }

                return;
            }

            if (!this.timerFn && this.text && key) {
                this.timerFn = setInterval(() => {
                    this.timer--;
                    if (this.timer === 0) {
                        this.modal = new bootstrap.Modal('#resultModal');
                        this.modal.show();
                        this.modal._element.addEventListener('hidden.bs.modal', () => {
                            this.text = '';
                            this.typed = '';
                            this.textTyped = '';
                            this.timer = -1;
                            this.modal = null;
                            this._right = 0;
                            this._wrong = 0;
                            this.wordsRight = 0;
                            this.wordsWrong = 0;
                            this.currentWord = 0;
                            this.timerFn = null;
                            document.querySelector('#wpm_input').focus();
                        });

                        clearInterval(this.timerFn);
                    }

                }, 100);
            }

            if (this.timer === 0) {
                e.preventDefault();
            }

            if (e.keyCode === 32 || e.keyCode === 13) {
                e.preventDefault();

                if (this.typed) {
                    if (this.typed === this.text_words[this.currentWord]) {
                        this.wordsRight++;
                    } else {
                        this.wordsWrong++;
                    }

                    this.textTyped += (' ' + this.typed);
                    this.textTyped = this.textTyped.trimStart();

                    this.typed = '';
                    this.currentWord++;

                    document.querySelector(`#word_${this.currentWord}`).scrollIntoView({behavior: 'smooth'});
                }
            } else if (e.keyCode === 8) {
                if (this.typed.split('').filter((char, i) => char !== this.text_words[this.currentWord][i]).length === 0) {
                    e.preventDefault();
                }
            }
        },

        calculateWrongChars() {
            const index = this.typed.length - 1;
            if (!this.letterRight(index)) {
                this._wrong++;
            }
        },

        letterRight(index) {
            return this.typed[index] === this.text_words[this.currentWord][index];
        }
    },
}).mount('#app');
