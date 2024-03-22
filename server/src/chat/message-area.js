import dateFormat from 'dateformat';
import React from 'react';

const dayInMillis = 60 * 60 * 24 * 1000;

export default class MessageArea extends React.Component {
    componentDidMount() {
        window.scrollTo(0, document.body.scrollHeight);
    }

    componentDidUpdate() {
        window.scrollTo(0, document.body.scrollHeight);
    }

    render() {
        const currentTime = new Date();
        const { messages, conf } = this.props; // Destructure props here

        return (
            <ol className="chat">
                {messages && messages.map(({ name, text, from, time }) => {
                    if (from === 'visitor') {
                        name = "You";
                    }
                    return (
                        <li className={from} key={time}>
                            <div className="msg">
                                <p>{name ? name + ': ' + text : text}</p>
                                {conf.displayMessageTime ? (
                                    <div className="time">
                                        {currentTime - new Date(time) < dayInMillis
                                            ? dateFormat(time, "HH:MM")
                                            : dateFormat(time, "m/d/yy HH:MM")}
                                    </div>
                                ) : (
                                    ''
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        );
    }
}
