import React, { useContext } from 'react';
import { Text, Layout, Card, Button } from '@ui-kitten/components';
import { styles } from './../styles/styles';
import { AppContext } from '../App';
import { TransitionPresets } from '@react-navigation/stack';
import { useActionSheet } from '@expo/react-native-action-sheet';


import { createStackNavigator } from '@react-navigation/stack';

import { Cards } from './Cards';
import { chunk } from 'lodash';
import { DeckAddEdit } from './DeckAddEdit';
import { SvgXml } from 'react-native-svg';
import { editSvgBase, getCustomSvg } from '../utils/customIcons';
import { TouchableOpacity, GestureResponderEvent, View } from 'react-native';
import { BottomMenu } from './BottomMenu';

type TTrainingModeInstructionsProps = {
    navigation: any; // TODO: I don't know the type of this
    route: any; // TODO: same.
}

const MAX_N_OF_DECKS = 9;

const EditButton = () => {
    return (
        <SvgXml
            style={ styles.editButtonSvg }
            width='18'
            height='18'
            xml={ getCustomSvg( editSvgBase, '#FFFFFF' ) }
        />
    );
};

const TrainingModeInstructions = ( props: TTrainingModeInstructionsProps ) => {

    const { navigation } = props;
    const { showActionSheetWithOptions } = useActionSheet();

    const appData = useContext( AppContext );
    const { decksData, removeSingleDeck, wordsWallet, onMenuClick } = appData;

    const chunkedDecks = chunk( decksData, 3 );

    const editClick = ( deckKey: number, event: GestureResponderEvent ) => {

        event.stopPropagation();

        showActionSheetWithOptions(
            {
                options: ['Cancel', 'Edit Deck', 'Delete Deck'],
                destructiveButtonIndex: 2,
                cancelButtonIndex: 0
            },
            buttonIndex => {
                if ( buttonIndex === 1 ) {
                    navigation.navigate( 'training-mode_new-deck', { deckKey, editMode: true } );
                }
                if ( buttonIndex === 2 ) {
                    removeSingleDeck( deckKey );
                }
            }
        );
    };

    const cardClick = ( deckKey: number ) => {
        navigation.navigate( 'training-mode_cards', { deckKey } );
    };

    return (
        <Layout style={ styles.megaWrap }>
            <Layout style={ styles.instructions }>


                <Text style={ [ styles.text, styles.titleText ] } category='h4'>Training mode</Text>

                <Text style={ styles.verySmallText }>{ '\n' }</Text>

                { wordsWallet.length > 0 && decksData.length > 1 &&
                    <Text style={ [ styles.text, styles.boldText, styles.smallerText, styles.leftAlignedText ] }>YOUR DECKS</Text>
                }

                { wordsWallet.length > 0 && decksData.length === 1 &&
                    <Text style={ [ styles.text, styles.smallerText, styles.lightText ] } >
                        You currently don't have any decks. { '\n' } Create a new one by clicking on the + icon below.
                    </Text>
                }

                { wordsWallet.length === 0 &&
                    <>
                        <Text style={ [ styles.text, styles.smallerText, styles.lightText ] } >
                            In this area you will be able to create custom decks with words coming from your wallet.
                            Start by adding some words there and then come back 🙂
                        </Text>
                        <Layout style={ styles.walletInstructions }>
                            <Button onPress={ () => { onMenuClick( 0 ); } } style={ styles.ctaButton }>
                                GO TO WALLET
                            </Button>
                        </Layout>
                    </>
                }

                { chunkedDecks.map( ( singleRow, rowKey ) => {

                    return (
                        <Layout key={ rowKey } style={ styles.decksWrapper }>
                            { singleRow.map( ( singleDeck, colNumber ) => {

                                if ( wordsWallet.length === 0 ) {
                                    return;
                                }

                                // deck key is calculated based on row and column
                                const deckKey = ( rowKey * 3 ) + colNumber;

                                if ( deckKey >= MAX_N_OF_DECKS ) {
                                    return (
                                        <Text style={ [ styles.text, styles.smallerText, styles.lightText ] }>
                                            You reached the maximum amount of allowed decks.
                                        </Text>
                                    );
                                }

                                if ( singleDeck.name === '__ADD_PLACEHOLDER__' ) {

                                    return (
                                        <Card
                                            onPress={ () => navigation.navigate( 'training-mode_new-deck' ) }
                                            style={ [
                                                styles.singleDeck,
                                                styles.addDeck,
                                                ( colNumber === 0 || colNumber === 2 ) && styles['singleDeck--noMargin']
                                            ] }
                                            key={ -1 }
                                        >
                                            <Text style={ styles.addDeckPlus }>+</Text>
                                        </Card>
                                    );
                                }

                                return (
                                    <Card
                                        onPress={ ( event ) => editClick( deckKey, event ) }
                                        style={ [
                                            styles.singleDeck,
                                            ( colNumber === 0 || colNumber === 2 ) && styles['singleDeck--noMargin']
                                        ] }
                                        key={ deckKey }
                                    >

                                        <EditButton />

                                        <TouchableOpacity
                                            onPress={ () => cardClick( deckKey ) }
                                        >
                                            <View style={ styles.deckName }>
                                                <Text style={ [ styles.whiteText, styles.smallerText ] }>{ singleDeck.name }</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </Card>
                                );
                            } ) }
                        </Layout>
                    );

                } ) }

            </Layout>
            <BottomMenu />
        </Layout>
    );
};

const Stack = createStackNavigator();

export const TrainingMode = () => {

    return (
        <Layout style={ styles.stackNavigatorWrapper } >
            <Stack.Navigator
                screenOptions={ {
                    cardStyle: { backgroundColor: '#fff' }
                } }
            >
                <Stack.Screen
                    name='training-mode_instructions'
                    options={ {
                        title: '',
                        animationEnabled: false,
                        headerLeft: () => null,
                        headerStyle: {
                            shadowColor: 'transparent',
                            elevation: 0
                        }
                    } }
                >
                    {
                        ( props ) => {
                            return (
                                <TrainingModeInstructions
                                    { ...props }
                                />
                            );
                        }
                    }
                </Stack.Screen>

                <Stack.Screen
                    name='training-mode_cards'
                    options={ {
                        headerShown: true,
                        title: '',
                        animationEnabled: true,
                        headerStyle: {
                            shadowColor: 'transparent',
                            elevation: 0
                        }
                    } }
                >
                    {
                        ( props ) => {
                            return (
                                <Cards
                                    { ...props }
                                />
                            );
                        }
                    }
                </Stack.Screen>

                <Stack.Screen
                    name='training-mode_new-deck'
                    options={ {
                        headerShown: false,
                        title: '',
                        animationEnabled: true,
                        cardOverlayEnabled: true,
                        headerStyle: {
                            shadowColor: 'transparent',
                            elevation: 0
                        },
                        ...TransitionPresets.ModalPresentationIOS
                    } }
                >
                    {
                        ( props ) => {
                            return (
                                <DeckAddEdit
                                    { ...props }
                                />
                            );
                        }
                    }
                </Stack.Screen>

            </Stack.Navigator>
        </Layout>
    );
};
