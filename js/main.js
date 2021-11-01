'use strict';

import * as Vue from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.20/vue.esm-browser.prod.js';

const app = Vue.createApp({
    data: () => ({
        text: '',
        currentWord: 0,
        initialTimer: 600,
        timer: 0,
        timerFn: null,
        textTyped: '',
        typed: '',
        _right: 0,
        _wrong: 0,
        wordsRight: 0,
        wordsWrong: 0,

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
        this.timer = this.initialTimer;
        document.querySelector('#wpm_input').focus();

        this.fetch_words();
    },

    computed: {
        text_words() {
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
            this._wrong = Math.max(this._wrong, this.full_typed_text().split(' ').map((word, i) => word.split('').filter((char, j) => j >= this.text_words[i].length || this.text_words[i][j] !== char).length).reduce((acc, v) => acc + v, 0));
            return this._wrong;
        },

        accuracy() {
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

        full_typed_text() {
            return (this.textTyped + (this.typed ? ' ' + this.typed : '')).trimStart();
        },

        gross_wpm() {
            return (this.right + this.wrong) / 5 / this.elapsed_time * 600;
        },

        net_wpm() {
            return this.gross_wpm() - this.wordsWrong / this.elapsed_time * 600;
        },

        keydown(e) {
            if (!this.timerFn && this.text) {
                this.timerFn = setInterval(() => {
                    this.timer--;
                    if (this.timer === 0) {
                        new bootstrap.Modal('#resultModal').show()
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

        letterRight(index) {
            return this.typed[index] === this.text_words[this.currentWord][index];
        }
    },
}).mount('#app');
