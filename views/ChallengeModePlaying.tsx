import { Layout, Text, Button } from '@ui-kitten/components';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext, TCards, TSingleWord } from '../App';
import { styles, mainColor } from '../styles/styles';
import { Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { QuizInput, TCallbackData } from 'react-native-quiz-input';
import Pie from 'react-native-pie';

import { flatten, shuffle } from 'lodash';
import { getFullWordString } from '../utils/utils';
import { getDeckPercentage } from './ChallengeMode';

const MAX_CHALLENGE_SIZE = 12;

type TChallengeModePlaying = {
    route: any; // TODO: can this be better typed?
    navigation: any; // TODO: can this be better typed?
}

type TProgressBar = {
    totalNumber: number;
    currentNumber: number;
};

type TWordRenderer = {
    currentWord: TSingleWord;
    currentView: TViewTypes;
    nextClick: ( wordToGuess: TSingleWord, typedWord: string ) => void
    continueClick: () => void
}

type TViewTypes = 'WORDGUESS' | 'CORRECT' | 'WRONG';



const getWordToGuessAsArray = ( word: TSingleWord ): string[] => {
    const fullWord = getFullWordString( word );
    return fullWord.split( '' );
};

const getWordStructure = ( letterArray: ReadonlyArray<string> ): ReadonlyArray<boolean> => {

    const binaryArr = letterArray.map( ( thisLetter ) => {
        if ( thisLetter !== ' ' ) {
            return true;
        } else {
            return false;
        }
    } );

    return binaryArr;
};

const getChallengePercentage = ( guessedWords: number, totalWordsInchallenge: number ): number => {

    if ( guessedWords === 0 || totalWordsInchallenge === 0 ) {
        return 0;
    }

    return Math.round( ( guessedWords * 100 ) / totalWordsInchallenge );
};

const ProgressBar = ( props: TProgressBar ) => {

    const { totalNumber, currentNumber  } = props;

    const fullBarWidth = Dimensions.get( 'window' ).width * 0.92;

    const singleBarWidth = ( fullBarWidth / totalNumber ) - 3;

    return (
        <Layout style={ styles.progressBarWrapper } >
            { [...Array( totalNumber )].map( ( element, index ) => {

                return (
                    <Layout
                        key={ index }
                        style={
                            // eslint-disable-next-line react-native/no-inline-styles
                            {
                                width: singleBarWidth,
                                height: 3,
                                backgroundColor: index > currentNumber ? '#ddd' : mainColor,
                                borderRadius: 6
                            }
                        }
                    />
                );
            } ) }
        </Layout>
    );
};

const getMaxNumberOfBoxes = (): number => {
    const totalWidth = Dimensions.get( 'window' ).width;

    return totalWidth / 32;
};

const WordRenderer = ( props: TWordRenderer  ) => {
    const { currentWord, currentView, nextClick, continueClick } = props;

    const wordToGuessAsArray = getWordToGuessAsArray( currentWord );

    const wordStructure = getWordStructure( wordToGuessAsArray );

    const [ typedWord, setTypedWord ] = useState( {} as TCallbackData );

    const isButtonEnabled = getFullWordString( currentWord ).length === typedWord?.wordString?.length;

    return (
        <>
            <Text
                style={ [
                    styles.text,
                    styles.veryBigText,styles.boldText
                ] }
            >
                { currentWord.en  }
            </Text>

            { currentView === 'WORDGUESS' &&
                <>
                    <Text style={ [ styles.text, styles.verySmallText, styles.lightText ] }>
                        Type it in German
                        { currentWord.wordType === 'n' || currentWord.wordType === 'm' || currentWord.wordType === 'f' ? ' (article included):' : '' }
                    </Text>
                    <Text style={ [ styles.verySmallText ] }>{ '\n' }</Text>

                    <QuizInput
                        wordStructure={ wordStructure }
                        key={ currentWord.de }
                        maxBoxesPerLine={ getMaxNumberOfBoxes() }
                        lineBreakOnSpace={ true }
                        onChange={ setTypedWord }
                    />

                    <Button
                        onPress={ isButtonEnabled ? () => nextClick( currentWord, typedWord.wordString ) : undefined }
                        style={ [
                            styles.ctaButton,
                            styles[ 'ctaButton--smallWidth'],
                            !isButtonEnabled && styles['createDeckCtaButton--Disabled']
                        ] }>
                        Send
                    </Button>

                    <Text onPress={ continueClick } style={ [ styles.text, styles.smallerText, styles.linkText ] }>
                        Skip
                    </Text>
                </>
            }
        </>
    );
};

const getShuffledDeck = ( deckCards: TCards ): TCards => {

    if ( deckCards.length <= MAX_CHALLENGE_SIZE ) {
        return shuffle( deckCards );
    }

    const shuffledDeck = shuffle( deckCards );

    const nonMasteredCards = shuffledDeck.filter( ( singleCard ) => !singleCard.mastered  );

    if ( nonMasteredCards.length >= MAX_CHALLENGE_SIZE ) {
        const deckPortion = nonMasteredCards.slice( 0, MAX_CHALLENGE_SIZE );
        return deckPortion;
    }

    const masteredCards = shuffledDeck.filter( ( singleCard ) => singleCard.mastered  );
    const masteredCardsShuffled = shuffle( masteredCards );
    const masteredCardsPortion = masteredCardsShuffled.slice( 0, MAX_CHALLENGE_SIZE - nonMasteredCards.length );

    const finalArray = [ ...nonMasteredCards, masteredCardsPortion ];

    return shuffle( flatten( finalArray ) );
};


export const ChallengeModePlaying = ( props: TChallengeModePlaying ) => {

    const { deckKey } = props.route?.params;
    const navigation = props.navigation;

    const appData = useContext( AppContext );
    const { decksData, markWordAsMastered } = appData;

    const currentDeck = decksData.find( ( deck ) => deck.id === deckKey );
    const currentDeckCards = ( currentDeck?.cards || [] );

    const [ currentDeckCardsShuffled, setShuffledCards ] = useState( [] as TCards );

    const [ currentView, setCurrentView ] = useState( 'WORDGUESS' as TViewTypes );

    const [ lastUserTypedWord, setLastUserTypedWord ] = useState( '' );

    const [ guessedCount, setGuessedCount ] = useState( 0 );

    const emojiRef = useRef( null ) as any;

    useEffect( () => {
        setShuffledCards( getShuffledDeck( currentDeckCards ) );
    }, [ currentDeckCards ] );

    useEffect( () => {
        if ( currentView === 'CORRECT' ) {
            emojiRef?.current?.tada( 1200 );
        }
        if ( currentView === 'WRONG' ) {
            emojiRef?.current?.shake( 1200 );
        }
    }, [ currentView, emojiRef ] );

    const [ currentCard, setCurrentCard ] = useState( 0 );

    const nextClick = ( wordToGuess: TSingleWord, typedWord: string ) => {

        const wordToGuessString = getFullWordString( wordToGuess );

        if ( wordToGuessString.toUpperCase() === typedWord.toUpperCase() ) {
            setCurrentView( 'CORRECT' );
            setGuessedCount( guessedCount + 1 );
            markWordAsMastered( wordToGuess, deckKey, true );
        }
        else {
            setCurrentView( 'WRONG' );
            setLastUserTypedWord( typedWord );
            markWordAsMastered( wordToGuess, deckKey, false );
        }
    };

    const continueClick = () => {
        setCurrentView( 'WORDGUESS' );
        setCurrentCard( currentCard + 1 );
    };

    const currentWord = currentDeckCardsShuffled[ currentCard ];

    if ( currentDeckCardsShuffled.length === 0 ) {
        return null;
    }

    if ( currentCard + 1 <= currentDeckCardsShuffled.length ) {

        return (
            <Layout style={ styles['centeredElement--mediumHorizontalPadding'] }>

                <ProgressBar
                    totalNumber={ currentDeckCardsShuffled.length || 0 }
                    currentNumber={ currentCard }
                />

                <Layout style={ styles.verticalSpacer } />

                <Layout>
                    <Text style={ [ styles.text, styles.verySmallText] } >{ currentCard + 1 }/{ currentDeckCardsShuffled.length || 0 }</Text>

                    <WordRenderer
                        currentWord={ currentWord }
                        nextClick={ nextClick }
                        continueClick={ continueClick }
                        currentView={ currentView }
                    />

                    { currentView !== 'WORDGUESS' &&
                        <>
                            <Text>{ '\n' }</Text>
                            <Animatable.Text ref={ emojiRef } style={ styles.bigEmoji }>{ currentView === 'CORRECT' ? '🎉' : '❌' }</Animatable.Text>
                            <Text>{ '\n' }</Text>

                            { currentView === 'WRONG' &&
                                <Text
                                    style={ [
                                        styles.text,
                                        styles.smallerText,
                                        styles.strikedText
                                    ] }
                                >
                                    { lastUserTypedWord.toLowerCase() }
                                </Text>
                            }

                            <Text
                                style={ [
                                    styles.text,
                                    styles.veryBigText,
                                    styles.greenText
                                ] }
                            >
                                { getFullWordString( currentWord ) }
                            </Text>

                            <Text>{ '\n' }</Text>
                            <Button
                                onPress={ continueClick }
                                style={ [
                                    styles.ctaButton,
                                    styles[ 'ctaButton--smallWidth']
                                ] }>
                                Continue
                            </Button>
                        </>
                    }

                </Layout>
            </Layout>
        );
    }

    if ( currentCard + 1 > currentDeckCardsShuffled.length ) {
        return (
            <Layout style={ styles['centeredElement--mediumHorizontalPadding'] }>
                <Text style={ [ styles.text, styles.titleText ] }>
                    Challenge completed!
                </Text>

                <Text style={ styles.bigEmoji }>
                    🏁
                </Text>

                <Text style={ [ styles.text ] }>
                    You guessed
                    <Text style={ [ styles.text, styles.boldText ] }> { guessedCount } </Text>
                    of
                    <Text style={ [ styles.text, styles.boldText ] }> { currentDeckCardsShuffled.length } </Text>
                    words
                </Text>

                <Text>{ '\n' }</Text>

                <Layout
                    style={ styles.graphsHolder }
                >
                    <Layout
                        style={ styles.endOfChallengeGraph }
                    >
                        <Text style={ [ styles.text, styles.smallerText, styles.boldText ] }>
                            Challenge Score
                        </Text>

                        <Text style={ [ styles.text, styles.verySmallText, styles.lightText ] }>
                            This is how you performed { '\n' } in this challenge { '\n' }
                        </Text>

                        <Pie
                            radius={ 60 }
                            innerRadius={ 45 }
                            sections={ [
                                {
                                    percentage: getChallengePercentage( guessedCount, currentDeckCardsShuffled.length ),
                                    color: mainColor
                                }
                            ] }
                            backgroundColor='#DC9CAE'
                        />

                        <Text style={ [ styles.text, styles.endOfChallengeGraphPercentage ] }>
                            { `${getChallengePercentage( guessedCount, currentDeckCardsShuffled.length )}%` }
                        </Text>
                    </Layout>

                    <Layout
                        style={ styles.endOfChallengeGraph }
                    >
                        <Text style={ [ styles.text, styles.smallerText, styles.boldText ] }>
                            Deck Score
                        </Text>

                        <Text style={ [ styles.text, styles.verySmallText, styles.lightText ] }>
                            This is your overall knowledge { '\n' } of this deck { '\n' }
                        </Text>

                        <Pie
                            radius={ 60 }
                            innerRadius={ 45 }
                            sections={ [
                                {
                                    percentage: getDeckPercentage( currentDeck! ),
                                    color: mainColor
                                }
                            ] }
                            backgroundColor='#DC9CAE'
                        />

                        <Text style={ [ styles.text, styles.endOfChallengeGraphPercentage ] }>
                            { `${getDeckPercentage( currentDeck! )}%` }
                        </Text>
                    </Layout>

                </Layout>

                <Text>{ '\n' }</Text>

                <Button
                    onPress={ navigation.goBack }
                    style={ [
                        styles.ctaButton,
                        styles[ 'ctaButton--smallWidth']
                    ] }>
                    Back to overview
                </Button>
            </Layout>
        );
    }

    return null;
};
